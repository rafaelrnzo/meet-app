"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import { useMemo, useState, useEffect } from "react";
import * as React from "react";
import Whiteboard from "../whiteboard/Whiteboard";
import { Controls } from "./Controls";
import "@livekit/components-styles";

function DebugTracks() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const identities = Array.from(
    new Set(tracks.map((t) => t.participant.identity)),
  );
  return (
    <div className="text-xs text-neutral-400 px-3 border-b border-neutral-800">
      {/* tracks: {tracks.length} | participants: {identities.length} →{" "}
      {identities.join(", ") || "—"} */}
    </div>
  );
}

type SimpleParticipantInfo = {
  identity: string;
  name?: string;
  sid?: string;
};

type ParticipantLike = Participant | SimpleParticipantInfo;

function CustomParticipantTile({
  trackRef,
  participant,
}: {
  trackRef?: any; // we keep it loose here to avoid fighting the helper types
  participant: ParticipantLike;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apakah ini LiveKit Participant (punya audioTracks + event emitter)?
  const isLiveKitParticipant = useMemo(
    () =>
      !!participant &&
      "audioTracks" in participant &&
      typeof (participant as any).on === "function" &&
      typeof (participant as any).off === "function",
    [participant],
  );

  // --- VIDEO: attach track ke <video> ---
  useEffect(() => {
    if (!trackRef?.publication || !videoRef.current) return;

    const publication = trackRef.publication as any;
    const videoTrack = publication.videoTrack || publication.track;

    if (videoTrack && videoTrack.kind === "video") {
      videoTrack.attach(videoRef.current);
      setIsVideoMuted(!!publication.isMuted);

      return () => {
        videoTrack.detach(videoRef.current!);
      };
    }
  }, [trackRef]);

  // --- VIDEO: update mute status dari event publication ---
  useEffect(() => {
    if (!trackRef?.publication) return;

    const publication = trackRef.publication as any;

    const handleMuted = () => setIsVideoMuted(true);
    const handleUnmuted = () => setIsVideoMuted(false);

    publication.on?.("muted", handleMuted);
    publication.on?.("unmuted", handleUnmuted);

    return () => {
      publication.off?.("muted", handleMuted);
      publication.off?.("unmuted", handleUnmuted);
    };
  }, [trackRef]);

  // --- AUDIO: cuma baca status mute + speaking, audio dihandle RoomAudioRenderer ---
  useEffect(() => {
    if (!isLiveKitParticipant) return;

    const lkParticipant = participant as Participant & {
      audioTracks?: Map<string, any>;
    };

    const updateAudioMuted = () => {
      // jaga-jaga kalau audioTracks nggak ada
      if (!lkParticipant.audioTracks || typeof lkParticipant.audioTracks.values !== "function") {
        setIsAudioMuted(true);
        return;
      }

      const audioPublications = Array.from(lkParticipant.audioTracks.values());
      const first = (audioPublications[0] ?? {}) as { isMuted?: boolean };

      // kalau nggak ada track audio, anggap muted
      setIsAudioMuted(first.isMuted ?? true);
    };

    const handleSpeakingChanged = (speaking: boolean) =>
      setIsSpeaking(speaking);

    // initial state
    updateAudioMuted();

    (lkParticipant as any).on?.("isSpeakingChanged", handleSpeakingChanged);
    (lkParticipant as any).on?.("trackMuted", updateAudioMuted);
    (lkParticipant as any).on?.("trackUnmuted", updateAudioMuted);

    return () => {
      (lkParticipant as any).off?.("isSpeakingChanged", handleSpeakingChanged);
      (lkParticipant as any).off?.("trackMuted", updateAudioMuted);
      (lkParticipant as any).off?.("trackUnmuted", updateAudioMuted);
    };
  }, [isLiveKitParticipant, participant]);

  const isScreenShare = trackRef?.source === Track.Source.ScreenShare;

  const hasVideo =
    !!trackRef?.publication &&
    !isVideoMuted &&
    !!(
      (trackRef.publication as any).videoTrack ||
      (trackRef.publication as any).track
    );

  const displayName = (participant as any).name || participant.identity;

  return (
    <div
      className={`relative rounded overflow-hidden bg-neutral-900 ${
        isSpeaking && !isScreenShare ? "ring-2 ring-green-500" : ""
      }`}
      style={{ minHeight: 180, width: "100%", height: "100%" }}
    >
      {/* Audio TIDAK di-attach di sini, cukup pakai <RoomAudioRenderer /> di root */}

      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: isScreenShare ? "none" : "scaleX(-1)" }}
          />

          {/* Overlay info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isScreenShare && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="text-white"
                  >
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 10.5v-9zM1.5 1a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z" />
                    <path d="M6 14h4v1H6v-1z" />
                  </svg>
                )}
                <span className="text-sm font-medium text-white">
                  {displayName}
                  {isScreenShare && "'s screen"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Mic mute indicator */}
                {isAudioMuted && !isScreenShare && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-500"
                  >
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-3 rounded-full bg-neutral-800 grid place-items-center text-neutral-300"
              style={{ width: 64, height: 64, fontSize: "24px", fontWeight: 700 }}
            >
              {participant.identity?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="text-sm text-neutral-300 font-medium">
              {displayName}
            </div>
            <div className="text-xs text-neutral-500 mt-1">kamera mati</div>

            {/* Mic mute indicator for audio-only */}
            {isAudioMuted && (
              <div className="mt-2 flex items-center justify-center gap-1 text-red-500">
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

function VideoGrid({
  roomName,
  serverUrl,
}: {
  roomName: string;
  serverUrl: string;
}) {
  const trackRefs = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  const participants = useParticipants();
  const [allParticipants, setAllParticipants] = useState<SimpleParticipantInfo[]>([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const apiUrl = serverUrl.replace(/^ws/, "http");
        const response = await fetch(`${apiUrl}/participants?room=${roomName}`);

        if (!response.ok) {
          console.log("API not available, using LiveKit hook participants");
          if (participants.length > 0) {
            setAllParticipants(
              participants.map((p) => ({
                identity: p.identity,
                name: p.name,
                sid: p.sid,
              })),
            );
          }
          return;
        }

        const text = await response.text();
        const data = JSON.parse(text);
        setAllParticipants(data);
      } catch (error) {
        console.log("Using LiveKit hook participants as fallback");
        if (participants.length > 0) {
          setAllParticipants(
            participants.map((p) => ({
              identity: p.identity,
              name: p.name,
              sid: p.sid,
            })),
          );
        }
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);

    return () => clearInterval(interval);
  }, [roomName, serverUrl, participants]);

  const displayParticipants: SimpleParticipantInfo[] =
    allParticipants.length > 0
      ? allParticipants
      : participants.map((p) => ({
          identity: p.identity,
          name: p.name,
          sid: p.sid,
        }));

  const stableTracks = useMemo(
    () =>
      trackRefs
        .slice()
        .sort((a, b) =>
          `${a.participant.identity}-${a.source}-${a.publication?.trackSid ?? ""}`.localeCompare(
            `${b.participant.identity}-${b.source}-${b.publication?.trackSid ?? ""}`,
          ),
        ),
    [trackRefs],
  );

  if (displayParticipants.length > 0) {
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
        {displayParticipants.map((apiParticipant) => {
          const participantTracks = stableTracks.filter(
            (t) => t.participant.identity === apiParticipant.identity,
          );

          if (participantTracks.length > 0) {
            return participantTracks.map((track) => (
              <CustomParticipantTile
                key={`${apiParticipant.identity}-${track.source}`}
                trackRef={track}
                // pakai LiveKit Participant asli saat ada track
                participant={track.participant}
              />
            ));
          }

          // Tidak ada track → avatar only, pakai data dari API
          return (
            <CustomParticipantTile
              key={apiParticipant.identity}
              trackRef={undefined}
              participant={apiParticipant}
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

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect
      audio
      video
      connectOptions={{ autoSubscribe: true }}
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={() => console.log("[LiveKit] connected")}
      onError={(e) => console.error("[LiveKit] onError:", e)}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0b0b0b",
        color: "#fff",
      }}
    >
      {/* Global audio handler */}
      <RoomAudioRenderer />

      <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="font-semibold">LiveKit Room</div>
        <button
          onClick={() => setShowWb((v) => !v)}
          className={`px-3 py-1 rounded ${
            showWb ? "bg-teal-600" : "bg-gray-800"
          } hover:bg-gray-700`}
          title="Toggle Whiteboard"
        >
          Whiteboard {showWb ? "ON" : "OFF"}
        </button>
      </div>

      <DebugTracks />

      <div className="flex-1 min-h-0 relative">
        <VideoGrid roomName={roomName} serverUrl={serverUrl} />
        <Whiteboard active={showWb} onClose={() => setShowWb(false)} />
      </div>

      <Controls />
    </LiveKitRoom>
  );
}
