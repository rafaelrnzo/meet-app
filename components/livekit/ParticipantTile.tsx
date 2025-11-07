"use client";

import {
  useTracks,
  ParticipantTile as LKTile,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track } from "livekit-client";

export function ParticipantGallery() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  return (
    <>
      <RoomAudioRenderer />

      <div
        className="gap-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {tracks.map((tr) => (
          <div key={`${tr.participant.identity}-${tr.source}`} className="rounded overflow-hidden">
            <LKTile trackRef={tr} />
          </div>
        ))}
      </div>
    </>
  );
}
