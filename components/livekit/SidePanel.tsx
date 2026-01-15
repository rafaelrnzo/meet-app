"use client";

import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { UserMinus, X, Video, PencilRuler, Disc } from "lucide-react";
import { useState, useEffect } from "react";
import { MeetingChat } from "./MeetingChat";
import { ServerRecordingControls } from "./ServerRecordingControls";

type SidebarTab = "chat" | "participants" | "tools" | "settings" | null;

interface SidePanelProps {
    activeTab: SidebarTab;
    onClose: () => void;
    roomName: string;
    onToggleWhiteboard: () => void;
    isWhiteboardOpen: boolean;
    isAdmin: boolean;
}

export function SidePanel({
    activeTab,
    onClose,
    roomName,
    onToggleWhiteboard,
    isWhiteboardOpen,
    isAdmin
}: SidePanelProps) {
    // If tab is settings (handled by VirtualBackgroundSelector) or null, don't render sidebar
    if (!activeTab || activeTab === "settings") return null;

    const [width, setWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            setWidth(Math.max(280, Math.min(600, newWidth)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing]);

    return (
        <div
            className="flex flex-col h-full bg-card/60 border-l border-border backdrop-blur-xl animate-in slide-in-from-right duration-200 relative"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-50 ${isResizing ? "bg-primary" : "bg-transparent"}`}
            >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-border rounded-full" />
            </div>

            {/* HEADER */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-card/40">
                <h3 className="font-semibold text-sm capitalize">
                    {activeTab === "tools" ? "Meeting Tools" : activeTab}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === "chat" && (
                    <MeetingChat roomCode={roomName} storage="session" />
                )}

                {activeTab === "participants" && (
                    <ParticipantListContent roomName={roomName} isAdmin={isAdmin} />
                )}

                {activeTab === "tools" && (
                    <ToolsListContent
                        roomName={roomName}
                        isAdmin={isAdmin}
                        onToggleWhiteboard={onToggleWhiteboard}
                        isWhiteboardOpen={isWhiteboardOpen}
                    />
                )}
            </div>
        </div>
    );
}

function ToolsListContent({
    roomName,
    isAdmin,
    onToggleWhiteboard,
    isWhiteboardOpen
}: {
    roomName: string;
    isAdmin: boolean;
    onToggleWhiteboard: () => void;
    isWhiteboardOpen: boolean;
}) {
    return (
        <div className="p-4 space-y-4">
            {/* Whiteboard Item */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <PencilRuler className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Whiteboard</span>
                        <span className="text-[10px] text-muted-foreground">Collaborative drawing</span>
                    </div>
                </div>
                <button
                    onClick={onToggleWhiteboard}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${isWhiteboardOpen
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border hover:bg-muted"
                        }`}
                >
                    {isWhiteboardOpen ? "Open" : "Start"}
                </button>
            </div>

            {/* Recording Item */}
            {isAdmin && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-red-500/10 text-red-500">
                            <Disc className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Recording</span>
                            <span className="text-[10px] text-muted-foreground">Record meeting to server</span>
                        </div>
                    </div>
                    <div className="scale-90 origin-right">
                        <ServerRecordingControls roomName={roomName} />
                    </div>
                </div>
            )}
        </div>
    )
}

function ParticipantListContent({ roomName, isAdmin }: { roomName: string, isAdmin: boolean }) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [kickLoading, setKickLoading] = useState<string | null>(null);

    const API_BASE =
        process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
        "http://localhost:8080";

    const getJwt = () => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("vc_token") || "";
    };

    const handleKick = async (identity: string) => {
        if (!confirm(`Are you sure you want to kick ${identity}?`)) return;
        setKickLoading(identity);
        try {
            const res = await fetch(`${API_BASE}/api/livekit/kick`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getJwt()}`,
                },
                body: JSON.stringify({ room_code: roomName, identity }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to kick");
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setKickLoading(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {participants.map((p) => {
                const isMe = p.identity === localParticipant.identity;
                return (
                    <div key={p.sid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {p.identity?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">
                                    {p.identity} {isMe && "(You)"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {p.isSpeaking ? "Speaking" : "Idle"}
                                </span>
                            </div>
                        </div>
                        {!isMe && isAdmin && (
                            <button
                                onClick={() => handleKick(p.identity)}
                                disabled={!!kickLoading}
                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                title="Kick Participant"
                            >
                                {kickLoading === p.identity ? (
                                    <span className="text-[10px]">...</span>
                                ) : (
                                    <UserMinus className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
