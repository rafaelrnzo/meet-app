"use client";

import { useParticipants, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { UserMinus, X, Video, PencilRuler, Disc, BarChart2, ChevronLeft, MicOff, Mic, MoreVertical, Ban, Unlock, RefreshCw, FileText, ChevronRight, Presentation, Hand, Dices } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { muteParticipant, banParticipant, unbanParticipant, fetchUserDbRooms, DbRoom } from "@/lib/api/admin-api";
import { toast } from "sonner";
import { Track } from "livekit-client";
import { MeetingChat } from "../chat/MeetingChat";
import { ServerRecordingControls } from "../controls/ServerRecordingControls";
import { PollingTool } from "../tools/Polling";
import { SharedNotes } from "../tools/SharedNotes";

import dynamic from "next/dynamic";
import { HostControls } from "../controls/HostControls";

const PDFSlideViewer = dynamic(
    () => import("../tools/PDFSlideViewer").then((mod) => ({ default: mod.PDFSlideViewer })),
    { ssr: false }
);

type SidebarTab = "chat" | "participants" | "tools" | "settings" | "host_controls" | "presentation" | null;

interface SidePanelProps {
    activeTab: SidebarTab;
    onClose: () => void;
    roomName: string;
    onToggleWhiteboard: () => void;
    isWhiteboardOpen: boolean;
    onTogglePresentation: () => void;
    isPresentationOpen: boolean;
    hasPresentation: boolean;
    isAdmin: boolean;
    toolsView?: "menu" | "polling" | "notes";
    onToolsViewChange?: (view: "menu" | "polling" | "notes") => void;
    presentationUrl?: string | null;
    onUndockPresentation?: () => void;
    width?: number | string;
    onWidthChange?: (w: number) => void;
    isYoutubeOpen?: boolean;
    onToggleYouTube?: () => void;
    onOpenYouTube?: (url: string) => void;
}

export function SidePanel({
    activeTab,
    onClose,
    roomName,
    onToggleWhiteboard,
    isWhiteboardOpen,
    onTogglePresentation,
    isPresentationOpen,
    hasPresentation,
    isAdmin,
    toolsView = "menu",
    onToolsViewChange,
    presentationUrl,
    onUndockPresentation,
    width: controlledWidth,
    onWidthChange,
    isYoutubeOpen,
    onToggleYouTube,
    onOpenYouTube
}: SidePanelProps) {
    const [internalWidth, setInternalWidth] = useState(320);
    const width = controlledWidth ?? internalWidth;
    const setWidth = onWidthChange ?? setInternalWidth;

    const [isResizing, setIsResizing] = useState(false);

    const animationFrame = useRef<number | undefined>(undefined);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            // Throttle updates using requestAnimationFrame to prevent UI lag
            if (animationFrame.current) return;

            animationFrame.current = requestAnimationFrame(() => {
                const newWidth = window.innerWidth - e.clientX;
                const maxWidth = Math.min(window.innerWidth * 0.8, 800); // Max 80% or 800px
                setWidth(Math.max(280, Math.min(maxWidth, newWidth)));
                animationFrame.current = undefined;
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
                animationFrame.current = undefined;
            }
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
            // Add overlay to iframe if exists to prevent capturing mouse events during drag
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(el => el.style.pointerEvents = 'none');
        } else {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(el => el.style.pointerEvents = 'auto');
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(el => el.style.pointerEvents = 'auto');
        };
    }, [isResizing, setWidth]);

    // If tab is settings (handled by VirtualBackgroundSelector) or null, don't render sidebar
    if (!activeTab || activeTab === "settings") return null;

    return (
        <div
            className="flex flex-col h-full bg-card/80 border-l border-border backdrop-blur-md relative group/sidebar"
            style={{ width: typeof width === 'number' ? `${width}px` : width, willChange: 'width' }}
        >


            {/* Resize Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/10 z-50 transition-colors flex items-center justify-center -translate-x-1/2"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                }}
            >
                {/* Visual Grip Indicator */}
                <div className="h-12 w-1 rounded-full bg-muted-foreground/30 group-hover/sidebar:bg-primary/50 transition-colors" />
            </div>

            {/* HEADER */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-card/40">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm capitalize">
                        {activeTab === "tools" ? "Meeting Tools" : activeTab === "host_controls" ? "Host Controls" : activeTab}
                    </h3>
                    {activeTab === "presentation" && onUndockPresentation && (
                        <button
                            onClick={onUndockPresentation}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Undock to Overlay"
                        >
                            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 13.5H1.5V1.5h6V.5h-6a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-6h-1v6zM10 1v1h2.293l-4.147 4.146.708.708L13 2.707V5h1V1h-4z" fill="currentColor" /></svg>
                        </button>
                    )}
                </div>
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
                        onTogglePresentation={onTogglePresentation}
                        isPresentationOpen={isPresentationOpen}
                        hasPresentation={hasPresentation}
                        view={toolsView}
                        setView={onToolsViewChange || (() => { })}
                        isYoutubeOpen={isYoutubeOpen}
                        onToggleYouTube={onToggleYouTube}
                        onOpenYouTube={onOpenYouTube}
                    />
                )}

                {activeTab === "host_controls" && (
                    <HostControls roomName={roomName} />
                )}

                {activeTab === "presentation" && presentationUrl && (
                    <div className="w-full h-full bg-white relative">
                        <PDFSlideViewer
                            url={presentationUrl}
                            isOpen={true}
                            onClose={() => { /* Handled by sidebar close */ }}
                            isAdmin={isAdmin}
                            roomName={roomName}
                            mode="embedded"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
function ToolsListContent({
    roomName,
    isAdmin,
    onToggleWhiteboard,
    isWhiteboardOpen,
    onTogglePresentation,
    isPresentationOpen,
    hasPresentation,
    view,
    setView,
    isYoutubeOpen,
    onToggleYouTube,
    onOpenYouTube
}: {
    roomName: string;
    isAdmin: boolean;
    onToggleWhiteboard: () => void;
    isWhiteboardOpen: boolean;
    onTogglePresentation: () => void;
    isPresentationOpen: boolean;
    hasPresentation: boolean;
    view: "menu" | "polling" | "notes";
    setView: (v: "menu" | "polling" | "notes") => void;
    isYoutubeOpen?: boolean;
    onToggleYouTube?: () => void;
    onOpenYouTube?: (url: string) => void;
}) {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    // Local state for YouTube input
    const [ytUrl, setYtUrl] = useState("");
    const [showYtInput, setShowYtInput] = useState(false);

    if (view === "polling") {
        return (
            <div className="flex flex-col h-full">
                <div className="p-2 border-b border-border">
                    <button
                        onClick={() => setView("menu")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Tools
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <PollingTool isAdmin={isAdmin} />
                </div>
            </div>
        );
    }

    if (view === "notes") {
        return <SharedNotes isAdmin={isAdmin} onBack={() => setView("menu")} roomName={roomName} />;
    }

    if (showYtInput) {
        return (
            <div className="flex flex-col h-full border-t border-border pt-4 mt-2">
                <div className="p-2 border-b border-border flex items-center justify-between">
                    <button
                        onClick={() => setShowYtInput(false)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-xs font-semibold">Share YouTube</span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                        Paste a YouTube link to watch together synchronously.
                    </p>
                    <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full bg-muted/50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (ytUrl && onOpenYouTube) {
                                onOpenYouTube(ytUrl);
                                setShowYtInput(false);
                                setYtUrl("");
                            }
                        }}
                        disabled={!ytUrl}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-xs transition-colors disabled:opacity-50"
                    >
                        Start Sharing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            <h4 className="text-[11px] font-semibold text-muted-foreground uppercase mb-3 px-1 tracking-wider">Collaboration</h4>

            <ToolItem
                icon={<FileText className="w-4.5 h-4.5 text-emerald-500" />}
                title="Shared Notes"
                description="Real-time collaborative notes"
                onClick={() => setView("notes")}
            />

            <ToolItem
                icon={<BarChart2 className="w-4.5 h-4.5 text-blue-500" />}
                title="Polling"
                description="Create and manage polls"
                onClick={() => setView("polling")}
            />

            <ToolItem
                icon={<PencilRuler className="w-4.5 h-4.5 text-violet-500" />}
                title="Whiteboard"
                description="Collaborative drawing canvas"
                onClick={onToggleWhiteboard}
                actionLabel={isWhiteboardOpen ? "Open" : "Start"}
                isActive={isWhiteboardOpen}
            />

            {hasPresentation && (
                <div className="pt-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase mb-3 px-1 tracking-wider">Content</h4>
                    <ToolItem
                        icon={<FileText className="w-4.5 h-4.5 text-orange-500" />}
                        title="Presentation"
                        description="View uploaded slides"
                        onClick={onTogglePresentation}
                        actionLabel={isPresentationOpen ? "Close" : "Open"}
                        isActive={isPresentationOpen}
                    />
                </div>
            )}

            <div className="pt-2">
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase mb-3 px-1 tracking-wider">Media</h4>
                <ToolItem
                    icon={<Video className="w-4.5 h-4.5 text-red-500" />}
                    title="YouTube Sync"
                    description="Watch video together"
                    onClick={() => {
                        if (isYoutubeOpen && onToggleYouTube) {
                            onToggleYouTube();
                        } else {
                            setShowYtInput(true);
                        }
                    }}
                    actionLabel={isYoutubeOpen ? "Close" : "Open"}
                    isActive={isYoutubeOpen}
                />
            </div>

            {isAdmin && (
                <div className="pt-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase mb-3 px-1 tracking-wider">Admin</h4>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors group border border-transparent hover:border-border cursor-pointer">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-md bg-muted/60 group-hover:bg-background group-hover:shadow-sm transition-all">
                                    <Disc className="w-4.5 h-4.5 text-red-500" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold">Recording</span>
                                    <span className="text-[11px] text-muted-foreground font-medium">Record meeting</span>
                                </div>
                            </div>
                            <div className="scale-90 origin-right">
                                <ServerRecordingControls roomName={roomName} />
                            </div>
                        </div>

                        <ToolItem
                            icon={<Dices className="w-4.5 h-4.5 text-blue-500" />}
                            title="Pick Random User"
                            description="Select a participant randomly"
                            onClick={async () => {
                                if (!room || !localParticipant) return;
                                const participants = Array.from(room.remoteParticipants.values());
                                // Filter out those who are waiting
                                const activeParticipants = participants.filter(p => {
                                    try {
                                        const md = p.metadata ? JSON.parse(p.metadata) : {};
                                        return md.status !== "waiting";
                                    } catch { return true; }
                                });

                                if (activeParticipants.length === 0) {
                                    toast.error("No other participants to pick from!");
                                    return;
                                }

                                const randomIdx = Math.floor(Math.random() * activeParticipants.length);
                                const winner = activeParticipants[randomIdx];
                                const winnerName = winner.identity;

                                // Broadcast to room
                                try {
                                    const data = new TextEncoder().encode(JSON.stringify({
                                        type: "random_user_selected",
                                        winner: winnerName
                                    }));
                                    await localParticipant.publishData(data, { reliable: true });
                                    toast.success(`Selected: ${winnerName}`);
                                } catch (e) {
                                    console.error("Failed to broadcast winner", e);
                                    toast.error("Failed to select user");
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function ToolItem({
    icon,
    title,
    description,
    onClick,
    actionLabel,
    isActive
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    actionLabel?: string;
    isActive?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all duration-200 group text-left ${isActive
                ? "bg-primary/5 border-primary/20"
                : "bg-card border-transparent hover:bg-accent hover:border-border"
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md transition-colors ${isActive ? "bg-background shadow-sm" : "bg-muted/60 group-hover:bg-background group-hover:shadow-sm"
                    }`}>
                    {icon}
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{description}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {actionLabel && (
                    <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-background border border-border shadow-sm ${isActive ? "text-primary border-primary/20" : "text-muted-foreground"}`}>
                        {actionLabel}
                    </span>
                )}
                {!actionLabel && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-all flex-shrink-0 -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                )}
            </div>
        </button>
    );
}

function ParticipantListContent({ roomName, isAdmin }: { roomName: string, isAdmin: boolean }) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [bannedUsers, setBannedUsers] = useState<string[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        loadBannedUsers();
    }, [roomName]);

    const loadBannedUsers = async () => {
        try {
            const userStr = localStorage.getItem("vc_user");
            const currentUserId = userStr ? JSON.parse(userStr).id : null;

            const rooms = await fetchUserDbRooms();
            const room = rooms.find(r => r.name === roomName || r.room_code === roomName);

            if (room) {
                if (room.banned_users) {
                    setBannedUsers(room.banned_users);
                }
                if (currentUserId && room.createdById === currentUserId) {
                    setIsCreator(true);
                }
            }
        } catch (e) {
            console.error("Failed to load banned users", e);
        }
    };

    const API_BASE =
        process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
        "http://localhost:8080";

    const getJwt = () => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("vc_token") || "";
    };

    const handleKick = async (identity: string) => {
        if (!confirm(`Are you sure you want to kick ${identity}?`)) return;
        setActionLoading(identity);
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
            setActionLoading(null);
        }
    };

    const handleBan = async (identity: string) => {
        if (!confirm(`Are you sure you want to ban ${identity}? They will be removed and unable to join.`)) return;
        setActionLoading(identity);
        try {
            await banParticipant(roomName, identity);
            toast.success(`Banned ${identity}`);
            loadBannedUsers();
        } catch (err: any) {
            toast.error("Failed to ban: " + err.message);
        } finally {
            setActionLoading(null);
            setOpenMenuId(null);
        }
    };

    const handleUnban = async (identity: string) => {
        setActionLoading(identity);
        try {
            await unbanParticipant(roomName, identity);
            toast.success(`Unbanned ${identity}`);
            loadBannedUsers();
        } catch (err: any) {
            toast.error("Failed to unban: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAdmit = async (identity: string) => {
        setActionLoading(identity);
        try {
            const res = await fetch(`${API_BASE}/api/livekit/admit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getJwt()}`,
                },
                body: JSON.stringify({ room_code: roomName, identity }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to admit");
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMute = async (identity: string, isMuted: boolean) => {
        const action = isMuted ? "Unmute" : "Mute";
        setActionLoading(identity);
        try {
            await muteParticipant(roomName, identity, !isMuted, !isMuted);
            toast.success(`${action}d ${identity}`);
        } catch (err: any) {
            toast.error(`Failed to ${action.toLowerCase()}: ` + err.message);
        } finally {
            setActionLoading(null);
            setOpenMenuId(null);
        }
    };

    const waitingParticipants = participants.filter(p => {
        const metadata = p.metadata ? JSON.parse(p.metadata) : {};
        return metadata.status === "waiting";
    });

    const activeParticipants = participants.filter(p => {
        const metadata = p.metadata ? JSON.parse(p.metadata) : {};
        return metadata.status !== "waiting";
    });

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-4 h-full">
            {/* Waiting Room Section */}
            {isAdmin && waitingParticipants.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Waiting Room ({waitingParticipants.length})</h4>
                    <div className="space-y-1">
                        {waitingParticipants.map((p) => (
                            <div key={p.sid} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-500 shrink-0">
                                        {p.identity?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">{p.identity}</span>
                                        <span className="text-[10px] text-muted-foreground">Waiting...</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleAdmit(p.identity)}
                                        disabled={!!actionLoading}
                                        className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                    >
                                        Admit
                                    </button>
                                    <button
                                        onClick={() => handleKick(p.identity)}
                                        disabled={!!actionLoading}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                        title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Participants Section */}
            <div className="space-y-2 h-full ">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">In Meeting ({activeParticipants.length})</h4>
                <div className="space-y-1">
                    {activeParticipants.map((p) => {
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
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === p.identity ? null : p.identity)}
                                            className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                            title="Options"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {openMenuId === p.identity && (
                                            <div ref={menuRef} className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-md z-50 py-1">
                                                {(() => {
                                                    const audioTrack = p.getTrackPublication(Track.Source.Microphone);
                                                    const isMuted = audioTrack ? audioTrack.isMuted : true; // Assume muted if no track

                                                    return (
                                                        <button
                                                            onClick={() => handleMute(p.identity, isMuted)}
                                                            disabled={!!actionLoading}
                                                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted transition-colors"
                                                        >
                                                            {isMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                                                            {isMuted ? "Unmute" : "Mute"}
                                                        </button>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => handleKick(p.identity)}
                                                    disabled={!!actionLoading}
                                                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-red-500/10 text-destructive hover:text-destructive transition-colors"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                    Kick
                                                </button>
                                                <button
                                                    onClick={() => handleBan(p.identity)}
                                                    disabled={!!actionLoading}
                                                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-red-500/10 text-destructive hover:text-destructive transition-colors"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                    Ban User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Hand Raised Icon */}
                                {(() => {
                                    const md = p.metadata ? JSON.parse(p.metadata) : {};
                                    return md.handRaised ? (
                                        <div className="p-1 bg-yellow-500/10 rounded border border-yellow-500/20" title="Hand Raised">
                                            <Hand className="w-3.5 h-3.5 text-yellow-500" />
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Banned Users Section */}
            {(isAdmin || isCreator) && (
                <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Banned Users ({bannedUsers.length})
                        </h4>
                        <button
                            onClick={() => loadBannedUsers()}
                            className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                            title="Refresh banned list"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </button>
                    </div>

                    {bannedUsers.length === 0 ? (
                        <div className="px-2 py-4 text-center border border-dashed border-border rounded-md">
                            <p className="text-xs text-muted-foreground italic">No banned users</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {bannedUsers.map((identity) => (
                                <div key={identity} className="flex items-center justify-between p-2 rounded-md bg-destructive/5 hover:bg-destructive/10 transition-colors border border-destructive/20">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive shrink-0">
                                            <Ban className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate">{identity}</span>
                                            <span className="text-[10px] text-destructive">Banned</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnban(identity)}
                                        disabled={!!actionLoading}
                                        className="p-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-muted transition-colors flex items-center gap-1"
                                        title="Unban"
                                    >
                                        <Unlock className="w-3 h-3" />
                                        Unban
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


