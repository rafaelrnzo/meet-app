"use client";

import { useParticipants, useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RemoteParticipant, RoomEvent } from "livekit-client";
import { Ban, ChevronDown, ChevronLeft, Clipboard, Copy, MessageSquare, Pin, Plus, Send, Trash2, User, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getUser } from "@/lib/api/auth-client";
import { LinkPreview } from "./LinkPreview";


const URL_REGEX = /(https?:\/\/[^\s]+)/g;

type ChatItem =
  | {
    id: string;
    ts: number;
    from: string;
    mine: boolean;
    type: "text";
    text: string;
    to?: string; // identity of recipient, undefined = everyone
    isRead?: boolean;
    isDeleted?: boolean;
  }
  | {
    id: string;
    ts: number;
    from: string;
    mine: boolean;
    type: "image";
    blob: Blob;
    mime: string;
    size: number;
    to?: string;
    isRead?: boolean;
    isDeleted?: boolean;
  };

type ChatTextPayload = {
  type: "chat";
  v: 1;
  id: string;
  ts: number;
  from: string;
  text: string;
  to?: string;
};

type ImageMetaPayload = {
  type: "image_meta";
  v: 1;
  id: string;
  ts: number;
  from: string;
  mime: string;
  size: number;
  to?: string;
};

type ImageChunkPayload = {
  type: "image_chunk";
  v: 1;
  id: string;
  seq: number;
  data: string; // base64 chunk
};

type ImageDonePayload = {
  type: "image_done";
  v: 1;
  id: string;
};

type ChatPinPayload = {
  type: "pin_message";
  v: 1;
  id: string; // message id to pin, or empty to unpin
  item?: ChatItem; // if pinning, send the item so others can render it immediately if they missed history? 
  // Actually, usually we just need ID. But to be safe if users don't have it, we might send text.
  // For now let's just send ID and rely on local history or bare minimum info.
  itemText?: string;
  itemType?: "text" | "image";
  from?: string;
  to?: string;
};

type ChatDeletePayload = {
  type: "delete_message";
  v: 1;
  targetId: string;
};

type Payload = ChatTextPayload | ImageMetaPayload | ImageChunkPayload | ImageDonePayload | ChatPinPayload | ChatDeletePayload;

const MAX_IMAGE_SIZE = 1_000_000; // 1MB after compress
const CHUNK_SIZE = 16_000;

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function clampText(s: string, max = 2000) {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

function base64FromUint8(u8: Uint8Array) {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    bin += String.fromCharCode(...u8.subarray(i, i + step));
  }
  return btoa(bin);
}

function uint8FromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function compressImage(file: File): Promise<Blob> {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const maxW = 1280;
  const scale = Math.min(1, maxW / img.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.8
    );
  });

  return blob;
}

async function publishReliable(room: any, obj: any, to?: string[]) {
  if (!room) return;
  if (room.state !== "connected") return;

  const bytes = new TextEncoder().encode(JSON.stringify(obj));

  try {
    // Try LiveKit v2 signature first: publishData(data, { reliable: true, destinationIdentities: [...] })
    await room.localParticipant.publishData(bytes, { reliable: true, destinationIdentities: to });
  } catch (e) {
    // Fallback to LiveKit v1 signature: publishData(data, kind, destinationIdentities)
    try {
      await room.localParticipant.publishData(bytes, DataPacket_Kind.RELIABLE, to);
    } catch (e2) {
      console.error("Failed to publish data", e, e2);
    }
  }
}

export function MeetingChat({
  roomCode,
  storage = "memory",
  maxItems = 200,
  onClose,
}: {
  roomCode: string;
  storage?: "memory" | "session";
  maxItems?: number;
  onClose?: () => void;
}) {
  const room = useRoomContext();
  const participants = useParticipants();

  const [items, setItems] = useState<ChatItem[]>([]);
  const [value, setValue] = useState("");
  // separate view state
  const [activeTab, setActiveTab] = useState<string>("everyone"); // "everyone" or participant identity
  const [isOpen, setIsOpen] = useState(false); // for new chat dropdown
  const [inConversation, setInConversation] = useState(true); // default to showing the active conversation (usually everyone)
  // Track open conversations (identities)
  const [conversations, setConversations] = useState<string[]>([]);
  // Unread counts map: identity -> count
  const [unread, setUnread] = useState<Record<string, number>>({});

  // Message Actions State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ChatItem } | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, ChatItem | null>>({}); // Keyed by "everyone" or participant identity
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const u = getUser();
    setIsAdmin(u?.role === "admin");
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isLoaded, setIsLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<ChatItem[]>(items);

  // Keep itemsRef in sync
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const me = room?.localParticipant?.identity || "me";
  const key = useMemo(() => `vc_chat_${roomCode}`, [roomCode]);

  const imageBuffers = useRef<
    Map<string, { meta: ImageMetaPayload; chunks: Map<number, Uint8Array> }>
  >(new Map());

  // Load from session storage on mount if enabled
  useEffect(() => {
    if (storage === "session") {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = safeParse<ChatItem[]>(saved);
        if (parsed) setItems(parsed);
      }
    }
    setIsLoaded(true);
  }, [storage, key]);

  // Save to session storage whenever items change
  useEffect(() => {
    if (!isLoaded) return;
    if (storage === "session") {
      // Only save text messages, blobs cannot be JSON stringified correctly and cause crashes on reload
      const toSave = items.filter((i) => i.type === "text");
      sessionStorage.setItem(key, JSON.stringify(toSave));
    }
  }, [items, storage, key, isLoaded]);

  // NOTE: We do NOT clear session storage on unmount anymore, 
  // so chat persists if user toggles the chat window within the same session.

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, pinnedMessages]); // Scroll when pinned message changes might not be desired, but new messages yes.

  // Close context menu on click anywhere
  useEffect(() => {
    const fn = () => setContextMenu(null);
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, []);

  // receive
  useEffect(() => {
    if (!room) return;

    const onData = (payload: Uint8Array, participant?: any, kind?: DataPacket_Kind) => {
      if (kind !== undefined && kind !== DataPacket_Kind.RELIABLE) return;

      const text = new TextDecoder().decode(payload);
      const msg = safeParse<Payload>(text);
      if (!msg) return;


      // text
      if (msg.type === "chat") {
        const from = msg.from || participant?.identity || "unknown";
        setItems((prev) => {
          if (prev.some((x) => x.id === msg.id)) return prev;

          // if private message, ensure conversation exists
          let isPrivate = false;
          let otherParty = "";

          // If to is defined and not me, I sent it privately? (Should rely on mine check)
          // Actually update logic for incoming:
          // Incoming private: msg.to === me. from = sender.
          // Incoming public: msg.to undefined.

          if (msg.to && msg.to === me) {
            isPrivate = true;
            otherParty = from;
          }

          if (isPrivate && otherParty) {
            setConversations(prevConvos => {
              if (!prevConvos.includes(otherParty)) return [...prevConvos, otherParty];
              return prevConvos;
            });

            // IF we are NOT in this conversation, mark unread
            if (activeTab !== otherParty) {
              setUnread(u => ({ ...u, [otherParty]: (u[otherParty] || 0) + 1 }));
            }
          }

          const next: ChatItem[] = [
            ...prev,
            { id: msg.id, ts: msg.ts, from, mine: from === me, type: "text", text: msg.text, to: msg.to },
          ];
          return next.slice(-maxItems);
        });
        return;
      }

      // image meta
      if (msg.type === "image_meta") {
        imageBuffers.current.set(msg.id, { meta: msg, chunks: new Map() });
        return;
      }

      // image chunk
      if (msg.type === "image_chunk") {
        const buf = imageBuffers.current.get(msg.id);
        if (!buf) return;
        buf.chunks.set(msg.seq, uint8FromBase64(msg.data));
        return;
      }

      // image done
      if (msg.type === "image_done") {
        const buf = imageBuffers.current.get(msg.id);
        if (!buf) return;

        const ordered = Array.from(buf.chunks.entries())
          .sort((a, b) => a[0] - b[0])
          .map((x) => x[1]);

        const blob = new Blob(ordered as BlobPart[], { type: buf.meta.mime });


        setItems((prev) => {
          if (prev.some((x) => x.id === msg.id)) return prev;

          // Handle private image conversation adding helper
          if (buf.meta.to && buf.meta.to === me) {
            const sender = buf.meta.from;
            setConversations(c => c.includes(sender) ? c : [...c, sender]);
            if (activeTab !== sender) {
              setUnread(u => ({ ...u, [sender]: (u[sender] || 0) + 1 }));
            }
          }

          const next: ChatItem[] = [
            ...prev,
            {
              id: msg.id,
              ts: buf.meta.ts,
              from: buf.meta.from,
              mine: buf.meta.from === me,
              type: "image",
              blob,
              mime: buf.meta.mime,
              size: buf.meta.size,
              to: buf.meta.to,
            },
          ];
          return next.slice(-maxItems);
        });

        imageBuffers.current.delete(msg.id);
        return;
      }

      // pin message
      if (msg.type === "pin_message") {

        // Determine scope
        let scope = "everyone";
        if (msg.to && msg.to === me) {
          // Private pin from someone to me -> scope is the sender
          scope = msg.from || "everyone";
        } else if (msg.from === me && msg.to) {
          // I pinned something in a private chat -> scope is the recipient (msg.to)
          scope = msg.to;
        }

        if (!msg.id) {
          setPinnedMessages(prev => ({ ...prev, [scope]: null }));
        } else {
          // Use itemsRef to find the item
          const currentItems = itemsRef.current;
          const found = currentItems.find(i => i.id === msg.id);

          if (found) {
            setPinnedMessages(prev => ({ ...prev, [scope]: found }));
          } else if (msg.itemText) {
            // Fallback
            const dummy: ChatItem = {
              id: msg.id,
              ts: Date.now(),
              from: "unknown",
              mine: false,
              type: (msg.itemType as "text" | "image") || "text",
              text: msg.itemText || "",
              blob: new Blob(),
              mime: "",
              size: 0
            };
            setPinnedMessages(prev => ({ ...prev, [scope]: dummy }));
          }
        }
        return;
      }

      // delete message
      if (msg.type === "delete_message") {
        setItems((prev) => prev.map(i => i.id === msg.targetId ? { ...i, isDeleted: true } : i));

        // Check if this message was pinned in any scope and remove it logic? 
        // Or strictly check if it's the current pinned one?
        // Let's iterate scopes and unpin if matched
        setPinnedMessages(prev => {
          const next = { ...prev };
          let changed = false;
          Object.entries(next).forEach(([scope, pinned]) => {
            if (pinned?.id === msg.targetId) {
              next[scope] = null;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
        return;
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, me, maxItems]);

  const sendText = async () => {
    if (!room) return;
    const t = clampText(value);
    if (!t) return;

    const isPrivate = activeTab !== "everyone";
    const recipient = isPrivate ? activeTab : undefined;

    const payload: ChatTextPayload = {
      type: "chat",
      v: 1,
      id: uuid(),
      ts: Date.now(),
      from: me,
      text: t,
      to: recipient,
    };

    const dest = recipient ? [recipient] : undefined;
    await publishReliable(room, payload, dest);

    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        { id: payload.id, ts: payload.ts, from: payload.from, mine: true, type: "text", text: payload.text, to: recipient },
      ];
      return next.slice(-maxItems);
    });
    setValue("");
  };

  const sendImageFile = async (file: File) => {
    if (!room) return;

    const blob = await compressImage(file);
    if (blob.size > MAX_IMAGE_SIZE) {
      alert("Gambar terlalu besar setelah kompres. Coba gambar lain / kecilkan resolusi.");
      return;
    }

    const isPrivate = activeTab !== "everyone";
    const recipient = isPrivate ? activeTab : undefined;

    const id = uuid();
    const meta: ImageMetaPayload = {
      type: "image_meta",
      v: 1,
      id,
      ts: Date.now(),
      from: me,
      mime: blob.type || "image/webp",
      size: blob.size,
      to: recipient,
    };

    const dest = recipient ? [recipient] : undefined;
    await publishReliable(room, meta, dest);

    const buf = new Uint8Array(await blob.arrayBuffer());
    let seq = 0;

    for (let i = 0; i < buf.length; i += CHUNK_SIZE) {
      const chunk = buf.slice(i, i + CHUNK_SIZE);
      const payload: ImageChunkPayload = {
        type: "image_chunk",
        v: 1,
        id,
        seq,
        data: base64FromUint8(chunk),
      };
      await publishReliable(room, payload, dest);
      seq++;
    }

    const done: ImageDonePayload = { type: "image_done", v: 1, id };
    await publishReliable(room, done, dest);

    // optimistic local render
    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        { id, ts: meta.ts, from: me, mine: true, type: "image", blob, mime: meta.mime, size: meta.size, to: recipient },
      ];
      return next.slice(-maxItems);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await sendImageFile(file);
        }
        break;
      }
    }
  };



  const handleDelete = async (id: string, fromIdentity: string) => {
    // Permission check
    // If not admin, can only delete own
    if (!isAdmin && fromIdentity !== me) {
      alert("You can only delete your own messages.");
      return;
    }

    // Optimistic update
    setItems((prev) => prev.map(i => i.id === id ? { ...i, isDeleted: true } : i));

    // Remove if pinned (simplified)
    const activePin = pinnedMessages[activeTab];
    if (activePin?.id === id) {
      setPinnedMessages(p => ({ ...p, [activeTab]: null }));
    }
    setContextMenu(null);

    // Broadcast delete
    if (!room) return;
    const payload: ChatDeletePayload = {
      type: "delete_message",
      v: 1,
      targetId: id
    };
    await publishReliable(room, payload);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePin = async (item: ChatItem) => {
    if (!isAdmin) return;

    const scope = activeTab; // "everyone" or user identity

    // Optimistic
    setPinnedMessages(p => ({ ...p, [scope]: item }));
    setContextMenu(null);

    if (!room) return;
    const payload: ChatPinPayload = {
      type: "pin_message",
      v: 1,
      id: item.id,
      itemText: item.type === "text" ? item.text : "",
      itemType: item.type
    };

    // If private scope, send ONLY to that person (and self?)
    // publishReliable by default sends to everyone unless destination is set.
    const dest = scope === "everyone" ? undefined : [scope];

    // We also need to set 'to' in payload so receiver knows scope? 
    // Actually, receiver knows scope by "from" if it's private.
    // But if I pin it, the other person receives it from "me".
    // If I pin it in "everyone", dest is undefined.
    // If I pin it in private, dest is [recipient].

    // Wait, ChatPinPayload definition doesn't strictly have `to` field for scoping? 
    // We should probably rely on the publish destination. 
    // But `publishReliable` takes `to`? Yes.

    // But wait, if I send a Private Pin to User B.
    // User B receives it. `msg.to` checks in `onData` rely on payload content or packet destination?
    // LiveKit `onData` generic payload doesn't easily expose destination if it's not in the data structure itself or packet metadata.
    // Our `publishReliable` wrapper encodes the JSON. 
    // The `onData` in `useEffect` decodes valid JSON.
    // We need to inject `to` inside the payload if we want `onData` logic to work as written: `if (msg.to && msg.to === me)`

    // Let's modify payload to include `to` if private.
    const fullPayload = { ...payload, to: scope === "everyone" ? undefined : scope };

    await publishReliable(room, fullPayload, dest);
  };

  const handleUnpin = async () => {
    if (!isAdmin) return;

    const scope = activeTab;
    // Optimistic
    setPinnedMessages(p => ({ ...p, [scope]: null }));

    if (!room) return;
    const payload: ChatPinPayload = {
      type: "pin_message",
      v: 1,
      id: "", // empty id means unpin
    };

    const dest = scope === "everyone" ? undefined : [scope];
    const fullPayload = { ...payload, to: scope === "everyone" ? undefined : scope };

    await publishReliable(room, fullPayload, dest);
  };

  // Scroll to message
  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20", "transition-colors", "duration-1000");
      setTimeout(() => el.classList.remove("bg-primary/20"), 2000);
    }
  };

  // Switch to specific chat
  const openChat = (identity: string) => {
    setActiveTab(identity);
    setInConversation(true);
    setIsOpen(false);
    // clear unread
    setUnread(prev => {
      const u = { ...prev };
      delete u[identity];
      return u;
    });
    // Add to conversations if not present
    if (identity !== "everyone" && !conversations.includes(identity)) {
      setConversations(p => [...p, identity]);
    }
  };

  // Filter items for view
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (activeTab === "everyone") {
        return !i.to; // Only public messages
      }
      // Private chat with activeTab
      // 1. I sent it to them (mine=true, to=activeTab)
      // 2. They sent it to me (from=activeTab, to=me)
      if (i.mine && i.to === activeTab) return true;
      if (!i.mine && i.from === activeTab) return true;
      return false;
    });
  }, [items, activeTab]);

  const activeParticipantName = useMemo(() => {
    if (activeTab === "everyone") return "Everyone";
    const p = participants.find(x => x.identity === activeTab);
    return p?.name || activeTab;
  }, [activeTab, participants]);

  // Identify available users not in conversation list yet
  const availableUsers = useMemo(() => {
    return participants.filter(p => p.identity !== me && !conversations.includes(p.identity));
  }, [participants, conversations, me]);


  return (
    <div className="h-full w-full flex flex-col bg-card/80 backdrop-blur-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50 h-14">
        <div className="flex items-center gap-2 overflow-hidden">
          {!inConversation ? (
            <span className="text-sm font-semibold text-foreground">Messages</span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInConversation(false)}
                className="p-1 hover:bg-muted-foreground/10 rounded mr-1"
                title="Back to list"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">{activeParticipantName}</span>
                {activeTab !== "everyone" && <span className="text-[10px] text-muted-foreground">Private Chat</span>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* If in list view, show add button */}
          {!inConversation && (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 hover:bg-muted-foreground/10 rounded-full border border-border"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              {isOpen && (
                <div className="absolute right-0 top-8 w-40 bg-popover border border-border rounded-md shadow-md z-10 py-1 max-h-48 overflow-auto">
                  {availableUsers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No other users</div>
                  ) : (
                    availableUsers.map(u => (
                      <button
                        key={u.identity}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors"
                        onClick={() => openChat(u.identity)}
                      >
                        {u.name || u.identity}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!inConversation ? (
        // LIST VIEW
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => openChat("everyone")}
            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 hover:bg-muted/30 transition-colors text-left group ${activeTab === 'everyone' ? 'bg-muted/50' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">Everyone</div>
              <div className="text-xs text-muted-foreground truncate">Public room chat</div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {conversations.map(cId => {
            const p = participants.find(x => x.identity === cId);
            const name = p?.name || cId;
            const count = unread[cId] || 0;
            return (
              <button
                key={cId}
                onClick={() => openChat(cId)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 hover:bg-muted/30 transition-colors text-left group`}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground truncate">{name}</span>
                    {count > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">Private conversation</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // CHAT VIEW
        <>
          {pinnedMessages[activeTab] && (
            <div className="bg-primary/5 border-b border-primary/20 px-3 py-2 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div
                className="flex flex-col flex-1 cursor-pointer"
                onClick={() => scrollToMessage(pinnedMessages[activeTab]!.id)}
              >
                <div className="text-[10px] text-primary font-bold flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned Message
                </div>
                <div className="text-xs text-foreground/80 truncate max-w-[200px]">
                  {pinnedMessages[activeTab]!.type === "text" ? pinnedMessages[activeTab]!.text : "📷 Image"}
                </div>
              </div>
              {isAdmin && (
                <button onClick={handleUnpin} className="p-1 hover:bg-black/5 rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 relative">
            {filteredItems.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                {activeTab === "everyone" ? "No messages yet." : "Start a private conversation."}
              </div>
            ) : (
              filteredItems.map((m) => (
                <div key={m.id} id={`msg-${m.id}`} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm border transition-all relative group/bubble ${m.mine
                      ? "bg-primary/90 text-primary-foreground border-primary/40"
                      : "bg-muted/70 text-foreground border-border"
                      }`}
                  >
                    <button
                      className={`absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded-full shadow-sm border border-border bg-background text-foreground z-10 hover:bg-muted ${m.isDeleted ? "hidden" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({ x: rect.left, y: rect.bottom + 5, item: m });
                      }}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {!m.mine && activeTab === "everyone" && <div className="text-[11px] text-muted-foreground mb-1">{m.from}</div>}

                    {/* Private label inside message bubble is redundant now that we have separated views, but can keep for clarity if needed. 
                            Actually, removed to be cleaner as requested. 
                        */}

                    {m.isDeleted ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground italic">
                        <Ban className="w-3.5 h-3.5 opacity-50" />
                        <span>This message was deleted</span>
                      </div>
                    ) : (
                      <>
                        {m.type === "text" ? (
                          <div className="whitespace-pre-wrap break-words">
                            {m.text}
                            {m.text.match(URL_REGEX) && (
                              <LinkPreview url={m.text.match(URL_REGEX)![0]} />
                            )}
                          </div>
                        ) : (
                          <BlobImage
                            blob={m.blob}
                            alt="chat image"
                            className="block w-full h-auto rounded-lg border border-border/30 object-contain"
                          />
                        )}
                      </>
                    )}

                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {new Date(m.ts).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/70 transition-all"
                placeholder={`Message ${activeParticipantName}...`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
              />

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  sendImageFile(f);
                  e.currentTarget.value = "";
                }}
              />

              <button
                onClick={() => fileRef.current?.click()}
                className="h-9 px-3 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-all"
                title="Send image"
              >
                <Clipboard className="w-4 h-4 " />

              </button>

              <button
                onClick={sendText}
                disabled={!value.trim()}
                className="h-9 p-2 rounded-lg text-sm font-medium border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4 " />

              </button>
            </div>

          </div>
        </>
      )}

      {/* Context Menu */}
      {contextMenu && mounted && createPortal(
        <div
          className="fixed z-[9999] bg-popover border border-border text-popover-foreground rounded-md shadow-md min-w-[120px] overflow-hidden p-1 flex flex-col gap-0.5"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {isAdmin && (
            <button
              onClick={() => handlePin(contextMenu.item)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted w-full text-left rounded-sm"
            >
              <Pin className="w-3.5 h-3.5" /> {pinnedMessages[activeTab]?.id === contextMenu.item.id ? "Unpin" : "Pin"}
            </button>
          )}
          {contextMenu.item.type === "text" && (
            <button
              onClick={() => handleCopy(contextMenu.item.type === 'text' ? contextMenu.item.text : "")}
              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted w-full text-left rounded-sm"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          )}
          <div className="h-px bg-border my-0.5" />
          <button
            onClick={() => handleDelete(contextMenu.item.id, contextMenu.item.from)}
            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-destructive/10 text-destructive w-full text-left rounded-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function BlobImage({ blob, alt, className }: { blob: Blob; alt?: string; className?: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!blob || !(blob instanceof Blob)) return;
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!src) return <div className={`animate-pulse bg-muted ${className}`} style={{ minHeight: "100px" }} />;

  return <img src={src} alt={alt} className={className} />;
}