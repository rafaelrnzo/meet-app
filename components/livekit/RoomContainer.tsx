"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  VideoTrack,
  StartAudio,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Track, type Participant, type LocalParticipant, RoomEvent, DataPacket_Kind, ParticipantEvent, DisconnectReason, Room } from "livekit-client";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Video, Users, ChevronLeft, ChevronRight, BarChart2, UserMinus } from "lucide-react";
import * as React from "react";
import Whiteboard from "../whiteboard/Whiteboard";
import { Controls } from "./Controls";
import "@livekit/components-styles";
import { VirtualBackgroundSelector } from "./VirtualBackgroundSelector";
import { ReactionOverlay } from "./ReactionOverlay";
import { SidePanel } from "./SidePanel";
import { Toaster, toast } from "sonner";
import { MediaChoices } from "@/components/features/meeting/PreJoin";
import { PollingProvider } from "./Polling";
import { fetchUserDbRooms, fetchRoomByCode, updateRoomPermissions } from "@/lib/api/admin-api";
import { PresentationViewer } from "./PresentationViewer";


type TrackRef = any;
type LayoutMode = "auto" | "grid" | "screen-horizontal";

function DebugTracks() {
  const trackRefs = useTracks(undefined, { onlySubscribed: false });
  const countTracks = trackRefs.length;
  //...
  // (I will apply the import change separately or together if possible. The `replace_file_content` tool works on contiguous blocks. I'll split into two calls if needed or try to capture both if close, but imports are at top and KickOverlay at bottom. So I need 2 calls or use proper targeting.)

  // Wait, I can't easily change imports and the bottom function in one go if they are far apart.
  // I'll start with the imports.

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
  const allParticipants = useParticipants();
  const participants = useMemo(() => {
    return allParticipants.filter((p) => {
      try {
        const md = p.metadata ? JSON.parse(p.metadata) : {};
        return md.status !== "waiting";
      } catch (e) {
        return true;
      }
    });
  }, [allParticipants]);
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

  // --- Grid Layout Calculation ---
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  const totalParticipants = participants.length;
  const totalPages = Math.ceil(totalParticipants / PAGE_SIZE) || 1;

  // Ensure current page is valid
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalParticipants, totalPages, page]);

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



  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleParticipants = participants.slice(startIndex, startIndex + PAGE_SIZE);
  const count = visibleParticipants.length;

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

  if (totalParticipants > 0) {
    return (
      <div className="w-full h-full p-2 bg-black/90 relative group">
        <div
          className="grid gap-2 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {visibleParticipants.map((p) => {
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <>
            {/* Previous Button */}
            {page > 1 && (
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next Button */}
            {page < totalPages && (
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Page Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Page {page} of {totalPages}
            </div>
          </>
        )}
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
  initialIsWaiting = false,
  initialMediaState,
}: {
  token: string;
  serverUrl: string;
  roomName: string;
  roomTitle?: string;
  initialIsWaiting?: boolean;
  initialMediaState?: MediaChoices;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecorder = searchParams.get("recorder") === "true";

  const wsUrl = serverUrl.startsWith("ws")
    ? serverUrl
    : serverUrl.replace(/^http/, "ws");

  const [showWb, setShowWb] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");
  const [activeSidebar, setActiveSidebar] = useState<"chat" | "participants" | "tools" | "settings" | "host_controls" | "presentation" | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [toolsView, setToolsView] = useState<"menu" | "polling">("menu");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("vc_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role;
          if (role === "admin" || (typeof role === "object" && role?.name === "admin")) {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error("Failed to parse user role", e);
      }
    }
  }, []);

  const [presentationPath, setPresentationPath] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [presentationMode, setPresentationMode] = useState<"overlay" | "sidebar">("overlay");

  useEffect(() => {
    (async () => {
      try {
        const currentRoom = await fetchRoomByCode(roomName);
        if (currentRoom) {
          setRoomId(currentRoom.id);
          if (currentRoom.presentation_path) {
            setPresentationPath(currentRoom.presentation_path);
          }
        }
      } catch (e) {
        console.error("Failed to fetch room info for presentation", e);
      }
    })();
  }, [roomName]);

  // Construct full presentation URL
  const fullPresentationPath = useMemo(() => {
    if (!presentationPath) return null;
    if (presentationPath.startsWith("http")) return presentationPath;

    // If we have a path but it's not absolute, we assume it's served via our proxy
    // Route: /api/presentations/:id
    if (!roomId) return null;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:8080";
    return `${baseUrl}/api/presentations/${roomId}`;
  }, [presentationPath, roomId]);

  // Sync Presentation State from Metadata
  useEffect(() => {
    if (!room) return;

    const checkMetadata = () => {
      const md = room.metadata ? JSON.parse(room.metadata) : {};
      if (md.presentation) {
        if (md.presentation.url) setPresentationPath(md.presentation.url);
        if (typeof md.presentation.isOpen === "boolean") setShowPresentation(md.presentation.isOpen);
      }
    };

    checkMetadata();
    room.on(RoomEvent.RoomMetadataChanged, checkMetadata);
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, checkMetadata);
    };
  }, [room]);

  const handleTogglePresentation = async () => {
    const newState = !showPresentation;

    // Ensure sidebar is closed if it was showing the presentation to avoid duplication/confusion
    if (activeSidebar === "presentation") {
      setActiveSidebar(null);
    }

    if (newState) {
      setPresentationMode("overlay");
    }

    if (isAdmin) {
      // Toggle for everyone
      try {
        const currentMeta = room?.metadata ? JSON.parse(room.metadata) : {};
        const newMeta = {
          ...currentMeta,
          presentation: {
            isOpen: newState,
            url: presentationPath // Ensure URL is preserved or updated if needed
          }
        };
        await updateRoomPermissions(roomName, newMeta);
        // Explicitly update local state in case metadata event is suppressed (same value) or slow
        setShowPresentation(newState);
      } catch (e) {
        toast.error("Failed to sync presentation state");
        // Fallback to local
        setShowPresentation(!showPresentation);
      }
    } else {
      // Local toggle for non-admins
      setShowPresentation(!showPresentation);
    }
  };

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

  if (isKicked) {
    return <KickedState />;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      audio={initialMediaState?.audioEnabled ?? false}
      video={initialMediaState?.videoEnabled ?? false}
      connectOptions={{ autoSubscribe: true }}
      options={{
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          deviceId: initialMediaState?.audioDeviceId
        },
        videoCaptureDefaults: {
          deviceId: initialMediaState?.videoDeviceId,
          resolution: { width: 1280, height: 720 }
        }
      }}
      onConnected={() => console.log("[LiveKit] connected to room:", roomName)}
      onDisconnected={(reason) => {
        console.log("[LiveKit] disconnected", reason);
        if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
          // We need to attempt to clean up tracks if possible, forcing them to stop.
          // Since we don't have direct access to the room object here (it's internal to LiveKitRoom unless ref is used),
          // we assume LiveKitRoom unmount (caused by state change) will handle most.
          // However, to be extra safe, we can try to access media streams if we had them.
          // Given the constraint, unmounting LiveKitRoom is the most effective way to kill the session.
          setIsKicked(true);
        }
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
      <RoomContextHelper onRoomReady={setRoom} />
      <RoomAudioRenderer />
      <StartAudio label="Klik untuk mengaktifkan audio" />
      <Toaster position="top-center" />

      {typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && (
        <div className="bg-destructive/90 text-destructive-foreground p-2 text-center text-sm font-medium">
          Warning: Media devices (Camera/Mic) are blocked by the browser on insecure connections (HTTP).
          Please use HTTPS or localhost, or configure your browser flags.
        </div>
      )}

      <PollingProvider>
        {isAdmin && <WaitingRoomListener isAdmin={isAdmin} roomName={roomName} />}
        <PollListener onPollCreated={(question, pollId) => {
          toast.custom((t) => (
            <div className="w-[340px] p-4 rounded-xl bg-card border border-border shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">New Poll Started</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {question}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ">
                <button
                  onClick={() => {
                    toast.dismiss(t);
                  }}
                  className="flex-1 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setActiveSidebar("tools");
                    setToolsView("polling");
                    toast.dismiss(t);
                  }}
                  className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors"
                >
                  Vote Now
                </button>
              </div>
            </div>
          ), { id: `poll-${pollId}`, duration: 10000 });
        }} />

        <WaitingRoomOverlay initialIsWaiting={initialIsWaiting} />

        {/* <DebugTracks /> */}

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 relative bg-background flex overflow-hidden">
          <ReactionOverlay />

          {/* Video Area */}
          <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden flex flex-col">
            <div className="flex-1 relative w-full h-full flex flex-col">
              <div className="flex-1 min-h-0 relative">
                <VideoGrid layoutMode={layoutMode} />
              </div>
              <Whiteboard active={showWb} onClose={() => setShowWb(false)} />
              <VirtualBackgroundSelector
                isOpen={activeSidebar === "settings"}
                onClose={() => setActiveSidebar(null)}
              />
            </div>
          </div>

          {/* Sidebar Panel (Desktop: Fixed right, Mobile: Overlay) */}
          <div className={`
             fixed inset-0 z-50 
             md:static md:z-auto
             transition-all duration-300
             ${(activeSidebar && activeSidebar !== "settings") ? "pointer-events-auto" : "pointer-events-none md:pointer-events-auto"}
        `}>
            {/* Mobile Backdrop */}
            <div
              className={`absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${activeSidebar && activeSidebar !== "settings" ? "opacity-100" : "opacity-0"}`}
              onClick={() => setActiveSidebar(null)}
            />

            {/* Sidebar Content Wrapper */}
            <div className={`
                h-full flex justify-end 
                w-full md:w-[var(--sidebar-width)]
                md:block md:overflow-hidden 
                transition-[transform,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${(activeSidebar && activeSidebar !== "settings") ? "translate-x-0" : "translate-x-full md:translate-x-0"}
            `}
              style={{
                '--sidebar-width': (activeSidebar && activeSidebar !== "settings") ? `${sidebarWidth}px` : '0px',
              } as React.CSSProperties}
            >
              <SidePanel
                activeTab={activeSidebar}
                onClose={() => setActiveSidebar(null)}
                roomName={roomName}
                onToggleWhiteboard={() => setShowWb(v => !v)}
                isWhiteboardOpen={showWb}
                onTogglePresentation={handleTogglePresentation}
                isPresentationOpen={showPresentation}
                hasPresentation={!!fullPresentationPath}
                isAdmin={isAdmin}
                toolsView={toolsView}
                onToolsViewChange={setToolsView}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
                presentationUrl={fullPresentationPath}
                onUndockPresentation={() => {
                  setPresentationMode("overlay");
                  // Optional: Close sidebar or switch to another tab? usually we just undock, sidebar stays open or closes?
                  // Providing better UX: Switch sidebar safely
                  setActiveSidebar(null);
                }}
              />
            </div>
          </div>
        </div>

        {fullPresentationPath && presentationMode === "overlay" && (
          <PresentationViewer
            url={fullPresentationPath}
            isOpen={showPresentation}
            onClose={() => setShowPresentation(false)}
            onDock={() => {
              setPresentationMode("sidebar");
              setActiveSidebar("presentation");
              setSidebarWidth(Math.min(window.innerWidth * 1, 800)); // Auto-expand to 60% or 800px
            }}
          />
        )}

        <div className="border-t border-border bg-card/60 backdrop-blur-md">
          <Controls
            roomName={roomName}
            activeSidebar={activeSidebar}
            onSidebarChange={setActiveSidebar}
            onTogglePresentation={handleTogglePresentation}
            isPresentationOpen={showPresentation}
            hasPresentation={!!fullPresentationPath}
          />
        </div>
      </PollingProvider>
    </LiveKitRoom >
  );
}

function PollListener({ onPollCreated }: { onPollCreated: (question: string, pollId: string) => void }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const onData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      if (kind !== DataPacket_Kind.RELIABLE) return;
      if (topic !== "polling") return;
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);
        if (data.type === "POLL_CREATE") {
          onPollCreated(data.poll.question, data.poll.id);
        }
      } catch (e) { }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => { room.off(RoomEvent.DataReceived, onData); };
  }, [room, onPollCreated]);
  return null;
}


function KickedState() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 ring-4 ring-destructive/20 animate-pulse">
        <UserMinus className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-foreground">You have been removed</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The host has removed you from this meeting.
      </p>
      <button
        onClick={() => router.push("/")}
        className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
      >
        Return to Home
      </button>
    </div>
  );
}

function WaitingRoomOverlay({ initialIsWaiting }: { initialIsWaiting: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const [metadata, setMetadata] = useState<any>(() => {
    try {
      return localParticipant?.metadata ? JSON.parse(localParticipant.metadata) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!localParticipant) return;

    const updateMetadata = () => {
      try {
        const md = localParticipant.metadata ? JSON.parse(localParticipant.metadata) : {};
        setMetadata(md);
      } catch (e) {
        // ignore json error
      }
    };

    // Initial update in case it changed before effect ran
    updateMetadata();

    const onMetadataChanged = () => {
      updateMetadata();
    };

    localParticipant.on(ParticipantEvent.ParticipantMetadataChanged, onMetadataChanged);

    return () => {
      localParticipant.off(ParticipantEvent.ParticipantMetadataChanged, onMetadataChanged);
    };
  }, [localParticipant]);

  const isWaiting = metadata.status === "waiting" || (metadata.status === undefined && initialIsWaiting);

  if (!isWaiting) return null;

  // ... (previous code)

  return (
    <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/20 animate-pulse">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting for Host</h2>
      <p className="text-muted-foreground max-w-md">
        Please wait, the meeting host will let you in shortly.
      </p>
    </div>
  );
}

function WaitingRoomListener({ isAdmin, roomName }: { isAdmin: boolean; roomName: string }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room || !isAdmin) return;

    const onParticipantConnected = (participant: any) => {
      const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
      if (metadata.status === "waiting") {
        toast.custom((t) => (
          <div className="w-[340px] p-4 rounded-xl bg-card border border-border shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">Pending Join Request</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  <span className="font-medium text-foreground">{participant.identity}</span> is waiting to join the meeting.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.dismiss(t)}
                className="flex-1 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={async () => {
                  // Optimistic UI update could go here
                  toast.dismiss(t);
                  try {
                    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:8080";
                    const token = localStorage.getItem("vc_token");
                    await fetch(`${API_BASE}/api/livekit/admit`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ room_code: roomName, identity: participant.identity }),
                    });
                    toast.success(`Admitted ${participant.identity}`);
                  } catch (e) {
                    toast.error("Failed to admit user");
                  }
                }}
                className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors"
              >
                Admit
              </button>
            </div>
          </div>
        ), { duration: 10000 });
      }
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room, isAdmin, roomName]);

  return null;
}

function RoomContextHelper({ onRoomReady }: { onRoomReady: (room: Room) => void }) {
  const room = useRoomContext();
  useEffect(() => {
    if (room) onRoomReady(room);
  }, [room, onRoomReady]);
  return null;
}
