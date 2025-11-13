"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Participant, RemoteTrackPublication, LocalTrackPublication } from "livekit-client";
import { Track } from "livekit-client";

/** tipe minimal trackRef dari useTracks() yang kita butuhkan */
type TrackRefLite = {
  participant: Participant;
  source?: Track.Source;
  publication?: RemoteTrackPublication | LocalTrackPublication | null;
};

type Props = {
  /** jika ada, tile akan coba render video/screen share dari trackRef */
  trackRef?: TrackRefLite;
  /** alternatif: pakai participant untuk placeholder saat tidak ada video */
  participant?: Participant;
  /** label tambahan (mis. “screen”) */
  secondaryLabel?: string;
  className?: string;
};

export default function CustomTile({ trackRef, participant: pAlt, secondaryLabel, className }: Props) {
  const videoEl = useRef<HTMLVideoElement | null>(null);

  const participant = trackRef?.participant ?? pAlt;
  const pub = trackRef?.publication ?? null;

  // deteksi apakah ini video track (camera / screenshare)
  const isVideoLike = useMemo(() => {
    if (!trackRef) return false;
    if (trackRef.source === Track.Source.ScreenShare) return true;
    if (trackRef.source === Track.Source.Camera) return true;
    return pub?.kind === "video";
  }, [trackRef, pub]);

  // attach/detach video ke <video> element
  useEffect(() => {
    const v = videoEl.current;
    const lkTrack: any = pub?.track || null;
    if (!v || !lkTrack || !isVideoLike) return;

    try {
      lkTrack.attach(v);
    } catch (e) {
      console.warn("[CustomTile] attach video error:", e);
    }
    return () => {
      try {
        lkTrack.detach(v);
      } catch {}
    };
  }, [pub?.track, isVideoLike]);

  if (!participant) {
    // kasus aneh: belum ada participant sama sekali
    return (
      <div className={`rounded border border-neutral-800 bg-neutral-900/60 p-4 ${className ?? ""}`}>
        <div className="text-neutral-400 text-sm">menunggu…</div>
      </div>
    );
  }

  // cek status mic dari participant
  const micPub = participant.getTrackPublication(Track.Source.Microphone) as
    | RemoteTrackPublication
    | LocalTrackPublication
    | undefined;
  const micMuted = micPub?.isMuted ?? true;

  // label nama
  const displayName = participant.name || participant.identity;

  // ---- render ----
  if (isVideoLike && pub?.isSubscribed !== false) {
    const isScreen = trackRef?.source === Track.Source.ScreenShare;

    return (
      <div className={`relative rounded overflow-hidden bg-black ${className ?? ""}`}>
        <video
          ref={videoEl}
          autoPlay
          playsInline
          muted={participant.isLocal} // mute diri sendiri
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* metadata strip */}
        <div className="absolute left-2 bottom-2 px-2 py-1 rounded bg-black/60 text-xs text-white flex items-center gap-2">
          {!isScreen && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${micMuted ? "bg-red-500" : "bg-green-400"}`}
              title={micMuted ? "mic muted" : "mic on"}
            />
          )}
          <span className="font-medium">{displayName}</span>
          {isScreen && <span className="opacity-80">screen</span>}
          {secondaryLabel && <span className="opacity-80">{secondaryLabel}</span>}
        </div>
      </div>
    );
  }

  // fallback tile (kamera mati / belum ada publish video)
  const initial =
    (participant.name?.[0] || participant.identity?.[0] || "?").toUpperCase();

  return (
    <div
      className={`rounded border border-neutral-800 bg-neutral-900/60 flex items-center justify-center p-4 ${className ?? ""}`}
      style={{ minHeight: 180 }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-3 rounded-full bg-neutral-800 grid place-items-center text-white"
          style={{ width: 64, height: 64, fontWeight: 700, fontSize: 20 }}
        >
          {initial}
        </div>
        <div className="text-sm text-neutral-200 font-medium">{displayName}</div>
        <div className="text-xs text-neutral-500 mt-1 flex items-center justify-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${micMuted ? "bg-red-500" : "bg-green-400"}`}
            title={micMuted ? "mic muted" : "mic on"}
          />
          <span>kamera mati</span>
        </div>
      </div>
    </div>
  );
}
