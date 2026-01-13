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
  Unlock,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function Controls({
  onToggleChat,
  isChatOpen,
  onToggleParticipants,
  isParticipantsOpen,
  onToggleEffects,
  isEffectsOpen,
}: {
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onToggleParticipants?: () => void;
  isParticipantsOpen?: boolean;
  onToggleEffects?: () => void;
  isEffectsOpen?: boolean;
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
  const [metadataStr, setMetadataStr] = useState("");
  const adminMenuRef = useRef<HTMLDivElement>(null);

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
  }, [allowAudio, allowVideo, allowScreen, isAdmin, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant]);


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
      await leaveRoomBackend(); // Clear Redis presence logic
      await room?.disconnect();
    } catch (e) {
      console.error("leave error:", e);
    }
  };

  // Admin Actions
  const updatePermission = async (key: string, val: boolean, muteKind?: "audio" | "video") => {
    if (!room) return;
    const newMeta = { ...metadata, [key]: val };

    try {
      // 1. Update Metadata
      await updateRoomPermissions(room.name, newMeta);

      // 2. If disabling, also mute everyone
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

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4 p-3 sm:p-4 relative">
      {/* MIC */}
      <button
        onClick={toggleMic}
        disabled={busy || (!allowAudio && !isAdmin)}
        className={baseBtn(false, busy || (!allowAudio && !isAdmin), isMicrophoneEnabled ? "normal" : "destructive")}
        aria-label="Toggle microphone"
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isMicrophoneEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
        {!allowAudio && !isAdmin && (
          <div className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5 border border-border">
            <Lock className="w-3 h-3 text-destructive" />
          </div>
        )}
      </button>

      {/* CAMERA */}
      <button
        onClick={toggleCam}
        disabled={busy || (!allowVideo && !isAdmin)}
        className={baseBtn(false, busy || (!allowVideo && !isAdmin), isCameraEnabled ? "normal" : "normal")} // Cam usually not red when off, just normal
        aria-label="Toggle camera"
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isCameraEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
        {!allowVideo && !isAdmin && (
          <div className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5 border border-border">
            <Lock className="w-3 h-3 text-destructive" />
          </div>
        )}
      </button>

      {/* SCREEN SHARE */}
      {(allowScreen || isAdmin) && (
        <button
          onClick={toggleScreen}
          disabled={busy}
          className={baseBtn(isScreenShareEnabled, busy, "normal")}
          aria-label="Toggle screen share"
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isScreenShareEnabled ? (
            <ScreenShareOff className="w-5 h-5" />
          ) : (
            <ScreenShare className="w-5 h-5" />
          )}
        </button>
      )}

      {/* CHAT */}
      <button
        onClick={onToggleChat}
        className={baseBtn(!!isChatOpen, busy, "normal")}
        aria-label="Toggle chat"
        disabled={busy}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* PARTICIPANTS */}
      <button
        onClick={onToggleParticipants}
        className={baseBtn(!!isParticipantsOpen, busy, "normal")}
        aria-label="Toggle participants"
        disabled={busy}
      >
        <Users className="w-5 h-5" />
      </button>

      {/* EFFECTS */}
      <button
        onClick={onToggleEffects}
        className={baseBtn(!!isEffectsOpen, busy, "normal")}
        aria-label="Toggle effects"
        disabled={busy}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* ADMIN SETTINGS */}
      {isAdmin && (
        <div className="relative" ref={adminMenuRef}>
          <button
            onClick={() => setShowAdminMenu(!showAdminMenu)}
            className={baseBtn(showAdminMenu, busy, "normal")}
            title="Admin Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {showAdminMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-card border border-border rounded-lg shadow-xl p-3 flex flex-col gap-3 z-50">
              <div className="px-1 py-1 text-xs font-semibold text-muted-foreground border-b border-border/50 pb-2">
                Admin Controls
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mic className="w-4 h-4" />
                  <span>Microphone</span>
                </div>
                <Switch
                  checked={allowAudio}
                  onCheckedChange={(checked) => updatePermission("allow_audio", checked, !checked ? "audio" : undefined)}
                />
              </div>

              {/* Video Toggle */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Video className="w-4 h-4" />
                  <span>Camera</span>
                </div>
                <Switch
                  checked={allowVideo}
                  onCheckedChange={(checked) => updatePermission("allow_video", checked, !checked ? "video" : undefined)}
                />
              </div>

              {/* Screen Toggle */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <ScreenShare className="w-4 h-4" />
                  <span>Screen Share</span>
                </div>
                <Switch
                  checked={allowScreen}
                  onCheckedChange={(checked) => updatePermission("allow_screen", checked)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEAVE */}
      <Link href="/" onClick={leaveRoom}>
        <button
          className={`${baseBtn(false, false, "destructive")} bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30`}
          aria-label="Leave room"
        >
          <Phone className="w-5 h-5 rotate-135" />
        </button>
      </Link>
    </div>
  );
}

export default Controls;
