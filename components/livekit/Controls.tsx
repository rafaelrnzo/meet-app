"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { leaveRoomBackend } from "@/lib/api/api";
import { muteAllParticipants, updateRoomPermissions } from "@/lib/api/admin-api";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { RoomEvent } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Loader2,
  MessageSquare,
  Users,
  Sparkles,
  Phone,
  Settings,
  Lock,
  Smile,
  Copy,
  Check,
  LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type SidebarTab = "chat" | "participants" | "tools" | "settings" | null;

export function Controls({
  roomName,
  activeSidebar,
  onSidebarChange,
}: {
  roomName: string;
  activeSidebar: SidebarTab;
  onSidebarChange: (tab: SidebarTab) => void;
}) {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
    lastMicrophoneError,
    lastCameraError,
  } = useLocalParticipant();

  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [metadataStr, setMetadataStr] = useState("");
  const [copied, setCopied] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const sendReaction = async (emoji: string) => {
    if (!room) return;
    try {
      const data = new TextEncoder().encode(JSON.stringify({ type: "reaction", emoji }));
      await localParticipant.publishData(data, { reliable: true });
      window.dispatchEvent(new CustomEvent("local-reaction", { detail: { emoji } }));
    } catch (e) {
      console.error("Failed to send reaction:", e);
    }
  };

  // Check Admin Role
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("vc_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error("Failed to parse user role", e);
      }
    }
  }, []);

  // Sync Metadata
  useEffect(() => {
    if (!room) return;
    setMetadataStr(room.metadata || "{}");

    const onMeta = (meta: string | undefined) => {
      setMetadataStr(meta || "{}");
    };
    room.on(RoomEvent.RoomMetadataChanged, onMeta);
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, onMeta);
    };
  }, [room]);

  // Click outside to close admin menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    };
    if (showAdminMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAdminMenu]);

  const metadata = useMemo(() => {
    try {
      return JSON.parse(metadataStr);
    } catch {
      return {};
    }
  }, [metadataStr]);

  const allowAudio = metadata.allow_audio !== false;
  const allowVideo = metadata.allow_video !== false;
  const allowScreen = metadata.allow_screen !== false;
  const allowReaction = metadata.allow_reaction !== false;

  // Enforce Mute if permissions revoked (and not admin)
  useEffect(() => {
    if (isAdmin) return;

    if (!allowAudio && isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(false);
    }
    if (!allowVideo && isCameraEnabled) {
      localParticipant.setCameraEnabled(false);
    }
    if (!allowScreen && isScreenShareEnabled) {
      localParticipant.setScreenShareEnabled(false);
    }
    if (!allowReaction && showReactions) {
      setShowReactions(false);
    }
  }, [allowAudio, allowVideo, allowScreen, allowReaction, isAdmin, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant, showReactions]);


  const toggleMic = async () => {
    if (busy) return;
    if (!allowAudio && !isAdmin) {
      alert("Microphone is disabled by admin");
      return;
    }
    try {
      setBusy(true);
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (e) {
      console.error("toggle mic error:", e, lastMicrophoneError);
      alert("Gagal mengaktifkan/mematikan mic. Cek permission & device.");
    } finally {
      setBusy(false);
    }
  };

  const toggleCam = async () => {
    if (busy) return;
    if (!allowVideo && !isAdmin) {
      toast.error("Camera is disabled by admin");
      return;
    }
    try {
      setBusy(true);
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error("toggle camera error:", e, lastCameraError);
      toast.error("Gagal mengaktifkan/mematikan kamera. Cek permission & device.");
    } finally {
      setBusy(false);
    }
  };

  const toggleScreen = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      console.error("toggle screen share error:", e);
      toast.error("Gagal mulai/berhenti screen share. Cek permission browser.");
    } finally {
      setBusy(false);
    }
  };

  const leaveRoom = async () => {
    try {
      await leaveRoomBackend();
      await room?.disconnect();
    } catch (e) {
      console.error("leave error:", e);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomName);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Admin Actions
  const updatePermission = async (key: string, val: boolean, muteKind?: "audio" | "video") => {
    if (!room) return;
    const newMeta = { ...metadata, [key]: val };

    try {
      await updateRoomPermissions(room.name, newMeta);
      if (val === false && muteKind) {
        await muteAllParticipants(room.name, muteKind === "audio", muteKind === "video");
      }
    } catch (e: any) {
      toast.error("Failed to update permissions: " + e.message);
    }
  };


  const baseBtn = (active: boolean, disabled: boolean, variant: "default" | "destructive" | "normal" = "normal") => `
    w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md relative
    ${variant === "destructive"
      ? "bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30"
      : active
        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
        : "bg-card border-border text-foreground hover:bg-muted"
    } 
    ${disabled ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border/50" : ""}
  `;

  const minimalBtn = (active: boolean, disabled: boolean) => `
    w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed relative
    ${active
      ? "bg-primary/15 text-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
    }
  `;

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 sm:px-6">

      {/* LEFT: Room Info */}
      <div className="hidden md:flex items-center gap-4 flex-1 justify-start min-w-0">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Room Code</div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-sm text-foreground select-all">{roomName}</span>
            <button onClick={copyRoomCode} className="text-muted-foreground hover:text-primary transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* CENTER: Media Controls */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1">
        {/* MIC */}
        <button
          onClick={toggleMic}
          disabled={busy || (!allowAudio && !isAdmin)}
          className={baseBtn(false, busy || (!allowAudio && !isAdmin), isMicrophoneEnabled ? "normal" : "destructive")}
          title="Microphone"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          {!allowAudio && !isAdmin && <div className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5 border border-border"><Lock className="w-3 h-3 text-destructive" /></div>}
        </button>

        {/* CAMERA */}
        <button
          onClick={toggleCam}
          disabled={busy || (!allowVideo && !isAdmin)}
          className={baseBtn(false, busy || (!allowVideo && !isAdmin), isCameraEnabled ? "normal" : "normal")}
          title="Camera"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          {!allowVideo && !isAdmin && <div className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5 border border-border"><Lock className="w-3 h-3 text-destructive" /></div>}
        </button>

        {/* SCREEN SHARE */}
        {(allowScreen || isAdmin) && (
          <button onClick={toggleScreen} disabled={busy} className={baseBtn(isScreenShareEnabled, busy, "normal")} title="Screen Share">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : isScreenShareEnabled ? <ScreenShareOff className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </button>
        )}

        {/* REACTIONS */}
        {(allowReaction || isAdmin) && (
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={baseBtn(showReactions, busy, "normal")}
              title="Reactions"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-card border border-border rounded-full shadow-xl p-2 flex gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                  <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEAVE */}
        <Link href="/" onClick={leaveRoom}>
          <button className={`${baseBtn(false, false, "destructive")} bg-red-600 border-red-600 hover:bg-red-700`} title="Leave">
            <Phone className="w-5 h-5 rotate-135" />
          </button>
        </Link>
      </div>

      {/* RIGHT: Tools & Sidebars */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">

        {/* Tools Toggle (Whiteboard, Record, etc) */}
        <button
          onClick={() => onSidebarChange(activeSidebar === "tools" ? null : "tools")}
          className={minimalBtn(activeSidebar === "tools", busy)}
          title="Tools & Activities"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* Participants */}
        <button
          onClick={() => onSidebarChange(activeSidebar === "participants" ? null : "participants")}
          className={minimalBtn(activeSidebar === "participants", busy)}
          title="Participants"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Chat */}
        <button
          onClick={() => onSidebarChange(activeSidebar === "chat" ? null : "chat")}
          className={minimalBtn(activeSidebar === "chat", busy)}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Effects */}
        <button
          onClick={() => onSidebarChange(activeSidebar === "settings" ? null : "settings")}
          className={minimalBtn(activeSidebar === "settings", busy)}
          title="Effects & Settings"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Admin Permissions Menu */}
        {isAdmin && (
          <div className="relative" ref={adminMenuRef}>
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className={minimalBtn(showAdminMenu, busy)}
              title="Admin Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showAdminMenu && (
              <div className="absolute bottom-full right-0 mb-4 w-64 bg-card border border-border rounded-lg shadow-xl p-3 flex flex-col gap-3 z-50">
                <div className="px-1 py-1 text-xs font-semibold text-muted-foreground border-b border-border/50 pb-2">
                  Permission Controls
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-sm text-foreground"><Mic className="w-4 h-4" /><span>Microphone</span></div>
                  <Switch checked={allowAudio} onCheckedChange={(checked) => updatePermission("allow_audio", checked, !checked ? "audio" : undefined)} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-sm text-foreground"><Video className="w-4 h-4" /><span>Camera</span></div>
                  <Switch checked={allowVideo} onCheckedChange={(checked) => updatePermission("allow_video", checked, !checked ? "video" : undefined)} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-sm text-foreground"><ScreenShare className="w-4 h-4" /><span>Screen Share</span></div>
                  <Switch checked={allowScreen} onCheckedChange={(checked) => updatePermission("allow_screen", checked)} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-sm text-foreground"><Smile className="w-4 h-4" /><span>Reactions</span></div>
                  <Switch checked={allowReaction} onCheckedChange={(checked) => updatePermission("allow_reaction", checked)} />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default Controls;
