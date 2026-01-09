"use client";

import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatItem =
  | {
    id: string;
    ts: number;
    from: string;
    mine: boolean;
    type: "text";
    text: string;
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
  };

type ChatTextPayload = {
  type: "chat";
  v: 1;
  id: string;
  ts: number;
  from: string;
  text: string;
};

type ImageMetaPayload = {
  type: "image_meta";
  v: 1;
  id: string;
  ts: number;
  from: string;
  mime: string;
  size: number;
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

type Payload = ChatTextPayload | ImageMetaPayload | ImageChunkPayload | ImageDonePayload;

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

async function publishReliable(room: any, obj: any) {
  if (!room) return;
  if (room.state !== "connected") return;

  const bytes = new TextEncoder().encode(JSON.stringify(obj));

  // LiveKit v2 signature: publishData(data, {reliable})
  if (room.localParticipant?.publishData?.length === 2) {
    await room.localParticipant.publishData(bytes, { reliable: true });
    return;
  }

  // LiveKit v1 fallback: publishData(data, kind)
  await room.localParticipant.publishData(bytes, DataPacket_Kind.RELIABLE);
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

  const [items, setItems] = useState<ChatItem[]>([]);
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const me = room?.localParticipant?.identity || "me";
  const key = useMemo(() => `vc_chat_${roomCode}`, [roomCode]);

  const imageBuffers = useRef<
    Map<string, { meta: ImageMetaPayload; chunks: Map<number, Uint8Array> }>
  >(new Map());

  // Clear chat when component unmounts (leaving room)
  useEffect(() => {
    return () => {
      if (storage === "session") {
        sessionStorage.removeItem(key);
      }
    };
  }, [storage, key]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length]);

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
          const next: ChatItem[] = [
            ...prev,
            { id: msg.id, ts: msg.ts, from, mine: from === me, type: "text", text: msg.text },
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
            },
          ];
          return next.slice(-maxItems);
        });

        imageBuffers.current.delete(msg.id);
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

    const payload: ChatTextPayload = {
      type: "chat",
      v: 1,
      id: uuid(),
      ts: Date.now(),
      from: me,
      text: t,
    };

    await publishReliable(room, payload);

    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        { id: payload.id, ts: payload.ts, from: payload.from, mine: true, type: "text", text: payload.text },
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

    const id = uuid();
    const meta: ImageMetaPayload = {
      type: "image_meta",
      v: 1,
      id,
      ts: Date.now(),
      from: me,
      mime: blob.type || "image/webp",
      size: blob.size,
    };

    await publishReliable(room, meta);

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
      await publishReliable(room, payload);
      seq++;
    }

    const done: ImageDonePayload = { type: "image_done", v: 1, id };
    await publishReliable(room, done);

    // optimistic local render
    // optimistic local render
    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        { id, ts: meta.ts, from: me, mine: true, type: "image", blob, mime: meta.mime, size: meta.size },
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

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border bg-card/80 backdrop-blur-sm flex flex-col shadow-sm">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
        <div className="text-sm font-semibold text-foreground">Chat</div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {storage === "session" ? "session cache" : "memory"}
          </span>
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

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">Belum ada pesan.</div>
        ) : (
          items.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm border ${m.mine
                  ? "bg-primary/90 text-primary-foreground border-primary/40"
                  : "bg-muted/70 text-foreground border-border"
                  }`}
              >
                {!m.mine && <div className="text-[11px] text-muted-foreground mb-1">{m.from}</div>}

                {m.type === "text" ? (
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                ) : (
                  <BlobImage
                    blob={m.blob}
                    alt="chat image"
                    className="block w-full h-auto rounded-lg border border-border/30 object-contain"
                  />
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
            placeholder="Enter message..."
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
            title="Kirim gambar"
          >
            📎
          </button>

          <button
            onClick={sendText}
            disabled={!value.trim()}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

function BlobImage({ blob, alt, className }: { blob: Blob; alt?: string; className?: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!src) return <div className={`animate-pulse bg-muted ${className}`} style={{ minHeight: "100px" }} />;

  return <img src={src} alt={alt} className={className} />;
}