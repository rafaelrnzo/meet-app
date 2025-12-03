"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrackPublication,
  type LocalTrackPublication,
} from "livekit-client";

type Pub = RemoteTrackPublication | LocalTrackPublication;

export type GridItem = {
  key: string;
  participant: Participant;
  videoPub?: Pub;           // kamera atau screenshare (satu per item)
  kind: "camera" | "screen";
  hasAudio: boolean;        // participant punya publikasi mic?
};

function collect(room: Room): GridItem[] {
  const out: GridItem[] = [];

  // Penting: pakai Array.from(...) saat spread iterator
  const everyone: Participant[] = [
    room.localParticipant,
    ...Array.from(room.remoteParticipants.values()),
  ];

  for (const p of everyone) {
    const mic = p.getTrackPublication(Track.Source.Microphone);

    const cam = p.getTrackPublication(Track.Source.Camera);
    if (cam) {
      out.push({
        key: `${p.identity}-cam-${cam.trackSid ?? "x"}`,
        participant: p,
        // videoPub: cam,
        kind: "camera",
        hasAudio: !!mic,
      });
    }

    // SCREEN (object sendiri) — tidak duplikasi key, ini push ke array baru
    const ss = p.getTrackPublication(Track.Source.ScreenShare);
    if (ss) {
      out.push({
        key: `${p.identity}-scr-${ss.trackSid ?? "x"}`,
        participant: p,
        // videoPub: ss,
        kind: "screen",
        hasAudio: !!mic,
      });
    }
  }

  return out;
}

export default function useTracksLite() {
  const room = useRoomContext();
  const [items, setItems] = useState<GridItem[]>(() => (room ? collect(room) : []));

  useEffect(() => {
    if (!room) return;

    const rebuild = () => setItems(collect(room));

    room
      .on(RoomEvent.ParticipantConnected, rebuild)
      .on(RoomEvent.ParticipantDisconnected, rebuild)
      .on(RoomEvent.TrackPublished, rebuild)
      .on(RoomEvent.TrackUnpublished, rebuild)
      .on(RoomEvent.LocalTrackPublished, rebuild)
      .on(RoomEvent.LocalTrackUnpublished, rebuild)
      .on(RoomEvent.TrackMuted, rebuild)
      .on(RoomEvent.TrackUnmuted, rebuild)
      .on(RoomEvent.Reconnected, rebuild)
      .on(RoomEvent.SignalConnected, rebuild);

    rebuild();

    return () => {
      room.off(RoomEvent.ParticipantConnected, rebuild);
      room.off(RoomEvent.ParticipantDisconnected, rebuild);
      room.off(RoomEvent.TrackPublished, rebuild);
      room.off(RoomEvent.TrackUnpublished, rebuild);
      room.off(RoomEvent.LocalTrackPublished, rebuild);
      room.off(RoomEvent.LocalTrackUnpublished, rebuild);
      room.off(RoomEvent.TrackMuted, rebuild);
      room.off(RoomEvent.TrackUnmuted, rebuild);
      room.off(RoomEvent.Reconnected, rebuild);
      room.off(RoomEvent.SignalConnected, rebuild);
    };
  }, [room]);

  return useMemo(() => ({ items }), [items]);
}