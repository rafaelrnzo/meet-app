"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile as LKTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";
import { Controls } from "./Controls";
import Whiteboard from "../whiteboard/Whiteboard";

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  if (!tracks.length) {
    return (
      <div className="w-full h-full grid place-items-center text-neutral-300">
        Menunggu peserta…
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-3"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        alignItems: "stretch",
      }}
    >
      {tracks.map((tr) => (
        <div
          key={`${tr.participant.identity}-${tr.source}-${tr.publication?.trackSid ?? "x"}`}
          className="rounded overflow-hidden"
        >
          <LKTile trackRef={tr} />
        </div>
      ))}
    </div>
  );
}

export function RoomContainer({
  token,
  serverUrl,
}: {
  token: string;
  serverUrl: string;
}) {
  const wsUrl = serverUrl.startsWith("ws") ? serverUrl : serverUrl.replace(/^http/, "ws");
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
        position: "relative",
      }}
    >
      <RoomAudioRenderer />

      <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="font-semibold">LiveKit Meeting</div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWb((v) => !v)}
            className={`px-3 py-1 rounded ${showWb ? "bg-teal-600" : "bg-gray-800"} hover:bg-gray-700`}
            title="Toggle Whiteboard"
          >
            📝 Whiteboard {showWb ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <VideoGrid />
        <Whiteboard active={showWb} onClose={() => setShowWb(false)} />
      </div>

      <Controls />
    </LiveKitRoom>
  );
}

export default RoomContainer;
