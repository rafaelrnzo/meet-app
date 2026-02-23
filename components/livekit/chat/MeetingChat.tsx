"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Copy, MessageSquare, Pin, Plus, Trash2, User, X } from "lucide-react";

import { useChat } from "./useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatItem } from "./types";

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
  const {
    items,
    activeTab,
    inConversation,
    setInConversation,
    conversations,
    unread,
    pinnedMessages,
    isAdmin,
    me,
    sendText,
    sendImageFile,
    handleDelete,
    handlePin,
    handleUnpin,
    openChat,
    participants,
  } = useChat({ roomCode, storage, maxItems });

  const [isOpen, setIsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ChatItem } | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, pinnedMessages]);

  useEffect(() => {
    const fn = () => setContextMenu(null);
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, []);

  // Filter items for view
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (activeTab === "everyone") {
        return !i.to;
      }
      if (i.mine && i.to === activeTab) return true;
      if (!i.mine && i.from === activeTab && i.to === me) return true;
      return false;
    });
  }, [items, activeTab, me]);

  const activeParticipantName = useMemo(() => {
    if (activeTab === "everyone") return "Everyone";
    const p = participants.find(x => x.identity === activeTab);
    return p?.name || activeTab;
  }, [activeTab, participants]);

  const availableUsers = useMemo(() => {
    return participants.filter(p => p.identity !== me && !conversations.includes(p.identity));
  }, [participants, conversations, me]);

  // Scroll to message
  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20", "transition-colors", "duration-1000");
      setTimeout(() => el.classList.remove("bg-primary/20"), 2000);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: ChatItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 5, item });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  const handleMenuDelete = () => {
    if (contextMenu) {
      handleDelete(contextMenu.item.id, contextMenu.item.from);
    }
  };

  const handleMenuPin = () => {
    if (contextMenu) {
      handlePin(contextMenu.item);
    }
  };

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
                        onClick={() => {
                          openChat(u.identity);
                          setIsOpen(false);
                        }}
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
                  {pinnedMessages[activeTab]!.type === "text" ? (pinnedMessages[activeTab] as any).text : "📷 Image"}
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
                <ChatMessage
                  key={m.id}
                  m={m}
                  activeTab={activeTab}
                  onContextMenu={handleContextMenu}
                />
              ))
            )}
            <div ref={endRef} />
          </div>

          <ChatInput
            activeParticipantName={activeParticipantName}
            onSendText={sendText}
            onSendImage={sendImageFile}
          />
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
              onClick={handleMenuPin}
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
            onClick={handleMenuDelete}
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