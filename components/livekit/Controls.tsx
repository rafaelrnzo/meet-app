"use client";

import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import Link from "next/link";
import { useState } from "react";

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

  return (
    <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-800 bg-black/40">
      <button
        onClick={toggleMic}
        className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
        aria-label="Toggle microphone"
        disabled={busy}
      >
        🎤 {isMicrophoneEnabled ? "Mute" : "Unmute"}
      </button>

      <button
        onClick={toggleCam}
        className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
        aria-label="Toggle camera"
        disabled={busy}
      >
        📷 {isCameraEnabled ? "Camera Off" : "Camera On"}
      </button>

      <button
        onClick={toggleScreen}
        className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
        aria-label="Toggle screen share"
        disabled={busy}
      >
        🖥️ {isScreenShareEnabled ? "Stop Share" : "Share Screen"}
      </button>

      <Link href="/">

        <button
          // onClick={() => { href = "/" }}
          className="px-4 py-2 bg-red-600 rounded text-white"
          aria-label="Leave room"
        >
          🚪 Leave
        </button>
      </Link>
    </div>
  );
}

export default Controls;
