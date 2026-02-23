import React, { useEffect, useState } from "react";
import { ChevronDown, Ban } from "lucide-react";
import { LinkPreview } from "./LinkPreview";
import { ChatItem } from "./types";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function BlobImage({ blob, alt, className }: { blob: Blob; alt?: string; className?: string }) {
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

interface ChatMessageProps {
    m: ChatItem;
    activeTab: string;
    onContextMenu: (e: React.MouseEvent, item: ChatItem) => void;
}

export function ChatMessage({ m, activeTab, onContextMenu }: ChatMessageProps) {
    return (
        <div id={`msg-${m.id}`} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm border transition-all relative group/bubble ${m.mine
                    ? "bg-primary/90 text-primary-foreground border-primary/40"
                    : "bg-muted/70 text-foreground border-border"
                    }`}
            >
                <button
                    className={`absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded-full shadow-sm border border-border bg-background text-foreground z-10 hover:bg-muted ${m.isDeleted ? "hidden" : ""}`}
                    onClick={(e) => onContextMenu(e, m)}
                >
                    <ChevronDown className="w-3 h-3" />
                </button>
                {!m.mine && activeTab === "everyone" && <div className="text-[11px] text-muted-foreground mb-1">{m.from}</div>}

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
    );
}
