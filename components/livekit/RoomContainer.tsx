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
import * as React from "react";
import Whiteboard from "../whiteboard/Whiteboard";
import { Controls } from "./Controls";
import "@livekit/components-styles";
import { MeetingChat } from "./MeetingChat";
import { UserMinus } from "lucide-react";
import { VirtualBackgroundSelector } from "./VirtualBackgroundSelector";


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

  if (wantScreenLayout && primaryScreenTrack) {
    const sideParticipants = participants.filter((p) => p.sid !== primaryScreenSid);

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
              <div key={p.sid} className="aspect-video h-full ">
                <CustomParticipantTile trackRef={trackForTile} participant={p} />
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
    <div className="w-full h-full grid place-items-center text-muted-foreground">
      Menunggu peserta…
    </div>
  );
}

function ServerRecordingControls({ roomName }: { roomName: string }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080";

  const getJwt = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vc_token") || "";
  };

  const startRecording = async () => {
    if (loading) return;
    setLoading(true);
    setLastError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/livekit/recordings/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getJwt()}`,
        },
        body: JSON.stringify({ room_name: roomName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      await res.json().catch(() => ({} as any));
      setIsRecording(true);
    } catch (err: any) {
      console.error("[Recording] gagal start:", err);
      setLastError(err?.message || "Gagal mulai recording");
      alert(`Gagal mulai recording: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (loading) return;
    setLoading(true);
    setLastError(null);

    try {
      const res = await fetch(`${API_BASE}/admin/livekit/recordings/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getJwt()}`,
        },
        body: JSON.stringify({ room_name: roomName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => ({} as any));
      const status: string = data.status || "";

      if (
        status === "EGRESS_ABORTED" ||
        status === "EGRESS_COMPLETE" ||
        status === "EGRESS_FAILED"
      ) {
        setIsRecording(false);
        return;
      }

      setIsRecording(false);
    } catch (err: any) {
      console.error("[Recording] gagal stop:", err);
      setLastError(err?.message || "Gagal stop recording");
      alert(`Gagal stop recording: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={loading}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all border flex items-center gap-1 ${isRecording
          ? "bg-destructive border-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-card border-border text-foreground hover:bg-muted"
          } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {loading
          ? "Processing..."
          : isRecording
            ? "Stop Recording"
            : "Record (Server)"}
      </button>
      {lastError && (
        <span className="text-[11px] text-destructive max-w-[200px] truncate">
          {lastError}
        </span>
      )}
    </div>
  );
}

// Resizable Chat Component
function ResizableChat({
  roomName,
  onClose,
}: {
  roomName: string;
  onClose: () => void;
}) {
  const [width, setWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      // Min 280px, Max 600px
      const clampedWidth = Math.max(280, Math.min(600, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      className="relative hidden md:flex flex-col border-l border-border bg-card/50 flex-shrink-0"
      style={{ width: `${width}px`, minWidth: "280px", maxWidth: "600px" }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors ${isResizing ? "bg-primary" : "bg-transparent"
          }`}
        style={{ zIndex: 10 }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-border rounded-full" />
      </div>

      {/* Chat Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MeetingChat
          roomCode={roomName}
          storage="session"
          onClose={onClose}
        />
      </div>
    </div>
  );
}


function ParticipantList({
  roomName,
  onClose,
}: {
  roomName: string;
  onClose: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [kickLoading, setKickLoading] = useState<string | null>(null);
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

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
    "http://localhost:8080";

  const getJwt = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("vc_token") || "";
  };

  const handleKick = async (identity: string) => {
    if (!confirm(`Are you sure you want to kick ${identity}?`)) return;
    setKickLoading(identity);
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
      // Success, LiveKit will handle the disconnect event
    } catch (err: any) {
      alert(err.message);
    } finally {
      setKickLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 border-l border-border w-[280px] md:w-[320px] backdrop-blur-sm">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Participants ({participants.length})</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {participants.map((p) => {
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
                <button
                  onClick={() => handleKick(p.identity)}
                  disabled={!!kickLoading}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Kick Participant"
                >
                  {kickLoading === p.identity ? (
                    <span className="text-[10px]">...</span>
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecorder = searchParams.get("recorder") === "true";

  const wsUrl = serverUrl.startsWith("ws")
    ? serverUrl
    : serverUrl.replace(/^http/, "ws");

  const [showWb, setShowWb] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("auto");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

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

      <div className="px-4 py-2 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground tracking-wide">
              LiveKit Room
            </span>
            <span className="text-[11px] text-muted-foreground">{roomName}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] bg-muted border border-border rounded-md px-1.5 py-0.5">
            <span className="px-1.5 text-muted-foreground">Layout</span>
            <button
              onClick={() => handleLayoutChange("auto")}
              className={`px-2 py-0.5 rounded transition-all text-xs font-medium ${layoutMode === "auto"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              Auto
            </button>
            <button
              onClick={() => handleLayoutChange("grid")}
              className={`px-2 py-0.5 rounded transition-all text-xs font-medium ${layoutMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              Grid
            </button>
            <button
              onClick={() => handleLayoutChange("screen-horizontal")}
              className={`px-2 py-0.5 rounded transition-all text-xs font-medium ${layoutMode === "screen-horizontal"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
                }`}
            >
              Screen
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ServerRecordingControls roomName={roomName} />
          <button
            onClick={() => setShowWb((v) => !v)}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${showWb
              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
              : "bg-card border-border text-foreground hover:bg-muted"
              }`}
          >
            Whiteboard {showWb ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <DebugTracks />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative bg-background flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden">
          <VideoGrid layoutMode={layoutMode} />
          <Whiteboard active={showWb} onClose={() => setShowWb(false)} />

          <VirtualBackgroundSelector
            isOpen={showEffects}
            onClose={() => setShowEffects(false)}
          />
        </div>

        {/* Resizable Chat Panel (Desktop Only) */}
        {showChat && (
          <ResizableChat
            roomName={roomName}
            onClose={() => setShowChat(false)}
          />
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <ParticipantList roomName={roomName} onClose={() => setShowParticipants(false)} />
        )}
      </div>

      {/* Mobile Chat Overlay */}
      {showChat && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full h-[80vh] bg-card rounded-t-3xl overflow-hidden border-t border-border shadow-2xl">
            <MeetingChat
              roomCode={roomName}
              storage="session"
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Participants Overlay */}
      {showParticipants && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full h-[60vh] bg-card rounded-t-3xl overflow-hidden border-t border-border shadow-2xl">
            <ParticipantList roomName={roomName} onClose={() => setShowParticipants(false)} />
          </div>
        </div>
      )}

      <div className="border-t border-border bg-card/60 backdrop-blur-md">
        <Controls
          onToggleChat={() => {
            setShowChat((v) => !v);
            if (!showChat) {
              setShowParticipants(false);
              setShowEffects(false);
            }
          }}
          isChatOpen={showChat}
          onToggleParticipants={() => {
            setShowParticipants((v) => !v);
            if (!showParticipants) {
              setShowChat(false);
              setShowEffects(false);
            }
          }}
          isParticipantsOpen={showParticipants}
          onToggleEffects={() => {
            setShowEffects((v) => !v);
            if (!showEffects) {
              setShowChat(false);
              setShowParticipants(false);
            }
          }}
          isEffectsOpen={showEffects}
        />
      </div>
    </LiveKitRoom>
  );
}