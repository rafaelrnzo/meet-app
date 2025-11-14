"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
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
} from "lucide-react";

export function Controls() {
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
      await room?.disconnect();
    } catch (e) {
      console.error("leave error:", e);
    }
  };

  const baseBtn =
    "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4 p-3 sm:p-4 border-t border-neutral-800 bg-black/60">
      <button
        onClick={toggleMic}
        className={`${baseBtn} ${
          isMicrophoneEnabled
            ? "bg-neutral-900/90 border-neutral-600 text-neutral-50 hover:bg-neutral-800"
            : "bg-red-600 border-red-500 text-white hover:bg-red-500"
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

      <button
        onClick={toggleCam}
        className={`${baseBtn} ${
          isCameraEnabled
            ? "bg-neutral-900/90 border-neutral-600 text-neutral-50 hover:bg-neutral-800"
            : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
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

      <button
        onClick={toggleScreen}
        className={`${baseBtn} ${
          isScreenShareEnabled
            ? "bg-teal-600 border-teal-500 text-white hover:bg-teal-500"
            : "bg-neutral-900/90 border-neutral-600 text-neutral-50 hover:bg-neutral-800"
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

      <Link href="/" onClick={leaveRoom}>
        <button
          className={`${baseBtn} bg-red-700 border-red-500 text-white hover:bg-red-600`}
          aria-label="Leave room"
        >
          <PhoneOff className="w-5 h-5 rotate-135" />
        </button>
      </Link>
    </div>
  );
}

export default Controls;
