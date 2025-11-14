"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  VideoTrack,
  StartAudio,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import { useMemo, useState, useEffect } from "react";
import * as React from "react";
import Whiteboard from "../whiteboard/Whiteboard";
import { Controls } from "./Controls";
import "@livekit/components-styles";

type TrackRef = any;
type LayoutMode = "auto" | "grid" | "screen-horizontal";

function DebugTracks() {
  const trackRefs = useTracks(undefined, { onlySubscribed: false });
  const countTracks = trackRefs.length;
  const ids = Array.from(new Set(trackRefs.map((t) => t.participant.identity)));
  return (
    <div className="text-[11px] text-neutral-400 px-4 py-1 border-b border-neutral-800 bg-black/40 flex items-center justify-between">
      <span className="opacity-70">
        tracks: {countTracks} | participants: {ids.length}
      </span>
      <span className="truncate max-w-[60%] text-neutral-500">
        {ids.join(", ") || "—"}
      </span>
    </div>
  );
}

function CustomParticipantTile({
  trackRef,
  participant,
}: {
  trackRef?: TrackRef;
  participant: Participant;
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const source: Track.Source | undefined =
    trackRef?.publication?.source ?? trackRef?.source;
  const isScreenShare = source === Track.Source.ScreenShare;

  useEffect(() => {
    const lkParticipant = participant as any;

    const updateAudioMuted = () => {
      const audioPubs: any[] = Array.from(
        lkParticipant.audioTracks?.values?.() ?? [],
      );
      const first = audioPubs[0] as { isMuted?: boolean } | undefined;
      setIsAudioMuted(first?.isMuted ?? true);
    };

    const handleSpeakingChanged = (speaking: boolean) =>
      setIsSpeaking(speaking);

    updateAudioMuted();

    lkParticipant.on?.("isSpeakingChanged", handleSpeakingChanged);
    lkParticipant.on?.("trackMuted", updateAudioMuted);
    lkParticipant.on?.("trackUnmuted", updateAudioMuted);

    return () => {
      lkParticipant.off?.("isSpeakingChanged", handleSpeakingChanged);
      lkParticipant.off?.("trackMuted", updateAudioMuted);
      lkParticipant.off?.("trackUnmuted", updateAudioMuted);
    };
  }, [participant]);

  const hasVideo =
    !!trackRef &&
    !!trackRef.publication &&
    (trackRef.publication as any).kind === Track.Kind.Video &&
    !!trackRef.publication.track;

  const displayName = participant.name || participant.identity;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-neutral-900/80 backdrop-blur-sm border border-neutral-800/70 ${
        isSpeaking && !isScreenShare ? "ring-2 ring-teal-500/70" : ""
      }`}
      style={{ width: "100%", height: "100%" }}
    >
      {hasVideo ? (
        <>
          <VideoTrack
            trackRef={trackRef}
            className="w-full h-full object-cover"
            style={{
              transform: isScreenShare ? "none" : "scaleX(-1)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isScreenShare && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="text-white"
                    >
                      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 10.5v-9zM1.5 1a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z" />
                      <path d="M6 14h4v1H6v-1z" />
                    </svg>
                  </div>
                )}
                <span className="text-sm font-medium text-white truncate">
                  {displayName}
                  {isScreenShare && "'s screen"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isAudioMuted && !isScreenShare && (
                  <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-red-500">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-black">
          <div className="text-center px-4">
            <div
              className="mx-auto mb-3 rounded-full bg-neutral-800 grid place-items-center text-neutral-50 shadow-lg shadow-black/40"
              style={{ width: 64, height: 64, fontSize: "24px", fontWeight: 700 }}
            >
              {participant.identity?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="text-sm text-neutral-100 font-medium">
              {displayName}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {isScreenShare ? "screen sharing" : "kamera mati"}
            </div>
            {isAudioMuted && !isScreenShare && (
              <div className="mt-2 flex items-center justify-center gap-1 text-red-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span className="text-xs">Muted</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoGrid({ layoutMode }: { layoutMode: LayoutMode }) {
  const participants = useParticipants();
  const trackRefs = useTracks(undefined, { onlySubscribed: false });

  const cameraTracksBySid = useMemo(() => {
    const map = new Map<string, TrackRef>();
    for (const t of trackRefs) {
      const pub: any = t.publication;
      if (!pub) continue;
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera) {
        map.set(t.participant.sid, t);
      }
    }
    return map;
  }, [trackRefs]);

  const screenTracksBySid = useMemo(() => {
    const map = new Map<string, TrackRef>();
    for (const t of trackRefs) {
      const pub: any = t.publication;
      if (!pub) continue;
      if (
        pub.kind === Track.Kind.Video &&
        pub.source === Track.Source.ScreenShare
      ) {
        map.set(t.participant.sid, t);
      }
    }
    return map;
  }, [trackRefs]);

  const allScreenTracks = Array.from(screenTracksBySid.values());
  const primaryScreenTrack = allScreenTracks[0] ?? null;
  const primaryScreenSid = primaryScreenTrack?.participant.sid;

  const wantScreenLayout =
    layoutMode === "screen-horizontal" ||
    (layoutMode === "auto" && primaryScreenTrack);

  if (wantScreenLayout && primaryScreenTrack) {
    const sideParticipants = participants.filter(
      (p) => p.sid !== primaryScreenSid,
    );

    return (
      <div className="flex flex-col h-full w-full gap-3 p-3">
        <div className="flex-1 min-h-0">
          <CustomParticipantTile
            trackRef={primaryScreenTrack}
            participant={primaryScreenTrack.participant}
          />
        </div>
        <div className="h-24 sm:h-28 md:h-32 lg:h-36 flex gap-3 overflow-x-auto pb-1">
          {sideParticipants.map((p) => {
            const camTrack = cameraTracksBySid.get(p.sid);
            const scrTrack = screenTracksBySid.get(p.sid);
            const trackForTile = camTrack ?? scrTrack;
            return (
              <div
                key={p.sid}
                className="aspect-video h-full flex-shrink-0"
              >
                <CustomParticipantTile
                  trackRef={trackForTile}
                  participant={p}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (participants.length > 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          alignItems: "stretch",
        }}
        className="p-3"
      >
        {participants.map((p) => {
          const camTrack = cameraTracksBySid.get(p.sid);
          const scrTrack = screenTracksBySid.get(p.sid);
          const trackForTile = camTrack ?? scrTrack;

          return (
            <CustomParticipantTile
              key={p.sid}
              trackRef={trackForTile}
              participant={p}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-full grid place-items-center text-neutral-300">
      Menunggu peserta…
    </div>
  );
}

function ScreenRecorderControls() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(true);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Screen recording tidak didukung di browser ini.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      streamRef.current = displayStream;

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          options = { mimeType: "video/webm;codecs=vp8" };
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          options = { mimeType: "video/webm" };
        }
      }

      const mediaRecorder = new MediaRecorder(displayStream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `meet-record-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err: any) {
      console.error("[Recorder] gagal start:", err?.name, err?.message);
      alert(`Tidak bisa mulai recording: ${err?.name || "Error"}`);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsRecording(false);
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="px-3 py-1 rounded-full bg-neutral-800/70 border border-neutral-700/80 text-[11px] text-neutral-500 cursor-not-allowed"
      >
        Record
      </button>
    );
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
        isRecording
          ? "bg-red-600 border-red-500 text-white hover:bg-red-500"
          : "bg-neutral-900/80 border-neutral-700 text-neutral-100 hover:bg-neutral-800"
      }`}
    >
      {isRecording ? "Stop Recording" : "Record"}
    </button>
  );
}

export default function RoomContainer({
  token,
  serverUrl,
  roomName,
}: {
  token: string;
  serverUrl: string;
  roomName: string;
}) {
  const wsUrl = serverUrl.startsWith("ws")
    ? serverUrl
    : serverUrl.replace(/^http/, "ws");
  const [showWb, setShowWb] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect
      audio
      video
      connectOptions={{ autoSubscribe: true }}
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={() =>
        console.log("[LiveKit] connected to room:", roomName)
      }
      onError={(e) => console.error("[LiveKit] onError:", e)}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#050505",
        color: "#fff",
      }}
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <StartAudio label="Klik untuk mengaktifkan audio" />
      <div className="px-4 py-2 border-b border-neutral-800 bg-gradient-to-r from-black via-neutral-950 to-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-neutral-50 tracking-wide">
              LiveKit Room
            </span>
            <span className="text-[11px] text-neutral-500">
              {roomName}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-neutral-950/80 border border-neutral-800 rounded-full px-1.5 py-0.5">
            <span className="px-1.5 text-neutral-500">Layout</span>
            <button
              onClick={() => handleLayoutChange("auto")}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                layoutMode === "auto"
                  ? "bg-teal-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => handleLayoutChange("grid")}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                layoutMode === "grid"
                  ? "bg-teal-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => handleLayoutChange("screen-horizontal")}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                layoutMode === "screen-horizontal"
                  ? "bg-teal-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              Screen
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScreenRecorderControls />
          <button
            onClick={() => setShowWb((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              showWb
                ? "bg-teal-600 border-teal-500 text-white hover:bg-teal-500"
                : "bg-neutral-900/80 border-neutral-700 text-neutral-100 hover:bg-neutral-800"
            }`}
          >
            Whiteboard {showWb ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      <DebugTracks />
      <div className="flex-1 min-h-0 relative bg-gradient-to-br from-neutral-950 via-black to-neutral-950">
        <VideoGrid layoutMode={layoutMode} />
        <Whiteboard active={showWb} onClose={() => setShowWb(false)} />
      </div>
      <div className="border-t border-neutral-800 bg-black/60">
        <Controls />
      </div>
    </LiveKitRoom>
  );
}
