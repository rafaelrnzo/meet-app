"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { leaveRoomBackend } from "@/lib/api/api";
import Link from "next/link";
import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
  Loader2,
  MessageSquare,
  Users,
  Sparkles,
} from "lucide-react";

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

  const toggleMic = async () => {
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
    try {
      setBusy(true);
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error("toggle camera error:", e, lastCameraError);
      alert("Gagal mengaktifkan/mematikan kamera. Cek permission & device.");
    } finally {
      setBusy(false);
    }
  };

  const toggleScreen = async () => {
    try {
      setBusy(true);
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      console.error("toggle screen share error:", e);
      alert("Gagal mulai/berhenti screen share. Cek permission browser.");
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

  const baseBtn =
    "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md";

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4 p-3 sm:p-4">
      {/* MIC */}
      <button
        onClick={toggleMic}
        className={`${baseBtn} ${isMicrophoneEnabled
          ? "bg-card border-border text-foreground hover:bg-muted"
          : "bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30"
          }`}
        aria-label="Toggle microphone"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isMicrophoneEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </button>

      {/* CAMERA */}
      <button
        onClick={toggleCam}
        className={`${baseBtn} ${isCameraEnabled
          ? "bg-card border-border text-foreground hover:bg-muted"
          : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
          }`}
        aria-label="Toggle camera"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isCameraEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </button>

      {/* SCREEN SHARE */}
      <button
        onClick={toggleScreen}
        className={`${baseBtn} ${isScreenShareEnabled
          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        aria-label="Toggle screen share"
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isScreenShareEnabled ? (
          <ScreenShareOff className="w-5 h-5" />
        ) : (
          <ScreenShare className="w-5 h-5" />
        )}
      </button>

      {/* CHAT */}
      <button
        onClick={onToggleChat}
        className={`${baseBtn} ${isChatOpen
          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        aria-label="Toggle chat"
        disabled={busy}
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* PARTICIPANTS */}
      <button
        onClick={onToggleParticipants}
        className={`${baseBtn} ${isParticipantsOpen
          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        aria-label="Toggle participants"
        disabled={busy}
      >
        <Users className="w-5 h-5" />
      </button>

      {/* EFFECTS */}
      <button
        onClick={onToggleEffects}
        className={`${baseBtn} ${isEffectsOpen
          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
          : "bg-card border-border text-foreground hover:bg-muted"
          }`}
        aria-label="Toggle effects"
        disabled={busy}
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* LEAVE */}
      <Link href="/" onClick={leaveRoom}>
        <button
          className={`${baseBtn} bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30`}
          aria-label="Leave room"
        >
          <PhoneOff className="w-5 h-5 rotate-135" />
        </button>
      </Link>
    </div>
  );
}

export default Controls;
