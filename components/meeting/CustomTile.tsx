"use client";

import { useEffect, useRef, useState } from "react";
import {
  Track,
  type Participant,
  type RemoteTrackPublication,
  type LocalTrackPublication,
  type RemoteAudioTrack,
  type RemoteVideoTrack,
  TrackEvent,
} from "livekit-client";
import type { GridItem } from "./useTracksLite";
import { useRoomContext } from "@livekit/components-react";

type Pub = RemoteTrackPublication | LocalTrackPublication;

function isRemotePublication(pub: Pub): pub is RemoteTrackPublication {
  // RemoteTrackPublication punya setSubscribed(); Local tidak
  return typeof (pub as any).setSubscribed === "function";
}

function attachVideo(pub: Pub | undefined, el: HTMLVideoElement | null) {
  if (!pub || !el) return;

  // Remote video
  const remoteVid = (pub as RemoteTrackPublication).videoTrack as
    | RemoteVideoTrack
    | null
    | undefined;
  if (remoteVid) {
    remoteVid.attach(el);
    return;
  }

  // Local video
  const localVid = (pub as LocalTrackPublication).videoTrack;
  if (localVid) {
    localVid.attach(el);
  }
}

function detachVideo(pub: Pub | undefined, el: HTMLVideoElement | null) {
  if (!pub || !el) return;

  const remoteVid = (pub as RemoteTrackPublication).videoTrack as
    | RemoteVideoTrack
    | null
    | undefined;
  if (remoteVid) {
    remoteVid.detach(el);
    return;
  }

  const localVid = (pub as LocalTrackPublication).videoTrack;
  if (localVid) {
    localVid.detach(el);
  }
}

function getMicPublication(p: Participant) {
  return p.getTrackPublication(Track.Source.Microphone);
}

export default function CustomTile({ item }: { item: GridItem }) {
  const room = useRoomContext();
  const { participant, videoPub, kind, hasAudio } = item;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [subscribed, setSubscribed] = useState<boolean>(!!videoPub?.isSubscribed);

  // ---------- VIDEO subscribe & attach ----------
  useEffect(() => {
    if (!videoPub) return;
    let cancelled = false;

    const ensureSubAndAttach = () => {
      try {
        // subscribe hanya untuk remote pub (sinkron, tidak perlu await)
        if (isRemotePublication(videoPub) && !videoPub.isSubscribed) {
          videoPub.setSubscribed(true);
        }
        if (!cancelled) setSubscribed(true);
        attachVideo(videoPub, videoRef.current);
      } catch (e) {
        console.error("[Tile] subscribe video error:", e);
      }
    };

    ensureSubAndAttach();

    const handleSubscribed = () => {
      detachVideo(videoPub, videoRef.current);
      attachVideo(videoPub, videoRef.current);
      setSubscribed(true);
    };
    const handleUnsubscribed = () => {
      detachVideo(videoPub, videoRef.current);
      setSubscribed(false);
    };

    // pakai enum TrackEvent, bukan string
    (videoPub as any).on?.(TrackEvent.Subscribed, handleSubscribed);
    (videoPub as any).on?.(TrackEvent.Unsubscribed, handleUnsubscribed);

    return () => {
      cancelled = true;
      (videoPub as any).off?.(TrackEvent.Subscribed, handleSubscribed);
      (videoPub as any).off?.(TrackEvent.Unsubscribed, handleUnsubscribed);
      detachVideo(videoPub, videoRef.current);
    };
  }, [videoPub]);

  // ---------- AUDIO (mic) attach ke <audio> tersembunyi ----------
  useEffect(() => {
    if (!room) return;
    if (participant.isLocal) return; // jangan play audio diri sendiri

    const micPub = getMicPublication(participant);
    if (!micPub || !hasAudio) return;

    const attach = () => {
      const track = micPub.audioTrack as RemoteAudioTrack | null | undefined;
      if (track && audioRef.current) {
        track.attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.autoplay = true;
        audioRef.current.volume = 1;
        audioRef.current.play().catch(() => {
          /* ignore autoplay rejection */
        });
      }
    };

    const detach = () => {
      const track = micPub.audioTrack as RemoteAudioTrack | null | undefined;
      if (track && audioRef.current) {
        track.detach(audioRef.current);
      }
    };

    try {
    //   // Add explicit check for micPub before using isRemotePublication
    //   if (micPub && isRemotePublication(micPub) && !micPub.isSubscribed) {
    //     micPub.setSubscribed(true); // sinkron
    //   }
      attach();
    } catch (e) {
      console.error("[Tile] subscribe audio error:", e);
    }

    const onSubChange = () => {
      detach();
      attach();
    };

    (micPub as any).on?.(TrackEvent.Subscribed, onSubChange);
    (micPub as any).on?.(TrackEvent.Unsubscribed, onSubChange);

    return () => {
      (micPub as any).off?.(TrackEvent.Subscribed, onSubChange);
      (micPub as any).off?.(TrackEvent.Unsubscribed, onSubChange);
      detach();
    };
  }, [room, participant, hasAudio]);

  return (
    <div
      className="relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800"
      style={{ aspectRatio: kind === "screen" ? "16 / 9" : "4 / 3" }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal} // cegah echo
        className="w-full h-full object-cover bg-black"
      />
      <audio ref={audioRef} className="hidden" />

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
        <div className="px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10">
          {participant.identity} {kind === "screen" ? "• screen" : ""}
        </div>
        {!subscribed && (
          <div className="px-2 py-1 rounded bg-yellow-600/80">subscribing…</div>
        )}
      </div>
    </div>
  );
}