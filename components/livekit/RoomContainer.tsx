"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  VideoTrack,
  StartAudio,
  useLocalParticipant,
} from "@livekit/components-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Track, type Participant } from "livekit-client";
import { useMemo, useState, useEffect, useRef } from "react";
import { Video, Users } from "lucide-react";
import * as React from "react";
import Whiteboard from "../whiteboard/Whiteboard";
import { Controls } from "./Controls";
import "@livekit/components-styles";
import { VirtualBackgroundSelector } from "./VirtualBackgroundSelector";
import { ReactionOverlay } from "./ReactionOverlay";
import { SidePanel } from "./SidePanel";


type TrackRef = any;
type LayoutMode = "auto" | "grid" | "screen-horizontal";

function DebugTracks() {
  const trackRefs = useTracks(undefined, { onlySubscribed: false });
  const countTracks = trackRefs.length;
  const ids = Array.from(new Set(trackRefs.map((t) => t.participant.identity)));
  return (
    <div className="text-[11px] text-muted-foreground px-4 py-1 border-b border-border bg-muted/50 flex items-center justify-between">
      <span className="opacity-70">
        tracks: {countTracks} | participants: {ids.length}
      </span>
      <span className="truncate max-w-[60%] text-muted-foreground">
        {ids.join(", ") || "—"}
      </span>
    </div>
  );
}

function CustomParticipantTile({
  trackRef,
  participant,
  fit,
}: {
  trackRef?: TrackRef;
  participant: Participant;
  fit?: "contain" | "cover";
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const source: Track.Source | undefined =
    trackRef?.publication?.source ?? trackRef?.source;
  const isScreenShare = source === Track.Source.ScreenShare;

  // Use explicit fit prop if provided, otherwise default based on source
  const objectFit = fit ?? (isScreenShare ? "contain" : "cover");

  useEffect(() => {
    const lkParticipant = participant as any;

    const updateAudioMuted = () => {
      const audioPubs: any[] = Array.from(
        lkParticipant.audioTracks?.values?.() ?? [],
      );
      const first = audioPubs[0] as { isMuted?: boolean } | undefined;
      setIsAudioMuted(first?.isMuted ?? true);
    };

    const handleSpeakingChanged = (speaking: boolean) => setIsSpeaking(speaking);

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
      className={`relative rounded-lg overflow-hidden bg-card backdrop-blur-sm border border-border shadow-sm ${isSpeaking && !isScreenShare ? "ring-2 ring-primary/70" : ""
        }`}
      style={{ width: "100%", height: "100%" }}
    >
      {hasVideo ? (
        <>
          <VideoTrack
            trackRef={trackRef}
            className={`w-full h-full bg-black ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
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
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted via-card to-background">
          <div className="text-center px-4">
            <div
              className="mx-auto mb-3 rounded-full bg-muted grid place-items-center text-foreground shadow-lg"
              style={{
                width: 64,
                height: 64,
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {participant.identity?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="text-sm text-foreground font-medium">
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isScreenShare ? "screen sharing" : "kamera mati"}
            </div>
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
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.ScreenShare) {
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

  // --- Screen Share Layout ---
  if (wantScreenLayout && primaryScreenTrack) {
    const sideParticipants = participants.filter((p) => p.sid !== primaryScreenSid);

    return (
      <div className="flex flex-row h-full w-full gap-2 p-2 relative min-h-0 bg-black/90">
        <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-black/20 border border-white/10">
          <CustomParticipantTile
            trackRef={primaryScreenTrack}
            participant={primaryScreenTrack.participant}
            fit="contain"
          />
        </div>
        {sideParticipants.length > 0 && (
          <div className="w-48 sm:w-56 md:w-64 flex flex-col gap-2 overflow-y-auto pr-1 shrink-0 pb-1">
            {sideParticipants.map((p) => {
              const camTrack = cameraTracksBySid.get(p.sid);
              const scrTrack = screenTracksBySid.get(p.sid);
              const trackForTile = camTrack ?? scrTrack;
              return (
                <div key={p.sid} className="aspect-video w-full shrink-0 border border-border/20 rounded-lg overflow-hidden relative">
                  <CustomParticipantTile trackRef={trackForTile} participant={p} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- Grid Layout Calculation ---
  const count = participants.length;

  // Simple heuristic for Col/Row calculation for landscape-ish container
  // Goal: maximize tile size while keeping them somewhat rectangular (landscape).
  let cols = 1;
  let rows = 1;

  if (count === 0) { cols = 1; rows = 1; }
  else if (count === 1) { cols = 1; rows = 1; }
  else if (count === 2) { cols = 2; rows = 1; }
  else if (count <= 4) { cols = 2; rows = 2; }
  else if (count <= 6) { cols = 3; rows = 2; }
  else if (count <= 9) { cols = 3; rows = 3; }
  else if (count <= 12) { cols = 4; rows = 3; }
  else if (count <= 16) { cols = 4; rows = 4; }
  else if (count <= 20) { cols = 5; rows = 4; }
  else { cols = 5; rows = 5; } // Max 25

  if (count > 0) {
    return (
      <div className="w-full h-full p-2 bg-black/90">
        <div
          className="grid gap-2 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {participants.map((p) => {
            const camTrack = cameraTracksBySid.get(p.sid);
            const scrTrack = screenTracksBySid.get(p.sid);
            const trackForTile = camTrack ?? scrTrack;

            return (
              <div key={p.sid} className="w-full h-full relative overflow-hidden rounded-lg border border-border/20">
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

  return (
    <div className="w-full h-full grid place-items-center text-muted-foreground bg-black/95">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
          <Users size={24} className="opacity-50" />
        </div>
        <p>Waiting for participants...</p>
      </div>
    </div>
  );
}






export default function RoomContainer({
  token,
  serverUrl,
  roomName,
  roomTitle,
}: {
  token: string;
  serverUrl: string;
  roomName: string;
  roomTitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecorder = searchParams.get("recorder") === "true";

  const wsUrl = serverUrl.startsWith("ws")
    ? serverUrl
    : serverUrl.replace(/^http/, "ws");

  const [showWb, setShowWb] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");
  const [activeSidebar, setActiveSidebar] = useState<"chat" | "participants" | "tools" | "settings" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLayoutChange = (mode: LayoutMode) => setLayoutMode(mode);

  if (isRecorder) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect
        audio
        video
        connectOptions={{ autoSubscribe: true }}
        options={{ adaptiveStream: true, dynacast: true }}
        style={{ height: "100vh", backgroundColor: "#000" }}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        <VideoGrid layoutMode="grid" />
      </LiveKitRoom>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect
      audio
      video
      connectOptions={{ autoSubscribe: true }}
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={() => console.log("[LiveKit] connected to room:", roomName)}
      onDisconnected={() => {
        console.log("[LiveKit] disconnected");
        router.push("/");
      }}
      onError={(e) => console.error("[LiveKit] onError:", e)}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <StartAudio label="Klik untuk mengaktifkan audio" />



      {/* <DebugTracks /> */}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative bg-background flex overflow-hidden">
        <ReactionOverlay />

        {/* Video Area */}
        <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            <VideoGrid layoutMode={layoutMode} />
            <Whiteboard active={showWb} onClose={() => setShowWb(false)} />
            <VirtualBackgroundSelector
              isOpen={activeSidebar === "settings"}
              onClose={() => setActiveSidebar(null)}
            />
          </div>
        </div>

        {/* Sidebar Panel (Desktop: Fixed right, Mobile: Overlay) */}
        <div className={`
             fixed inset-0 z-50 md:static md:z-auto md:w-auto
             ${activeSidebar ? "flex" : "hidden md:hidden"}
             justify-end md:block
        `}>
          {/* Mobile Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setActiveSidebar(null)}
          />

          {/* Sidebar Content */}
          <SidePanel
            activeTab={activeSidebar}
            onClose={() => setActiveSidebar(null)}
            roomName={roomName}
            onToggleWhiteboard={() => setShowWb(v => !v)}
            isWhiteboardOpen={showWb}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <div className="border-t border-border bg-card/60 backdrop-blur-md">
        <Controls
          roomName={roomName}
          activeSidebar={activeSidebar}
          onSidebarChange={setActiveSidebar}
        />
      </div>
    </LiveKitRoom >
  );
}