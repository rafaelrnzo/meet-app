// "use client";

// import {
//   RoomAudioRenderer,
//   ParticipantTile as LKTile,
//   useTracks,
// } from "@livekit/components-react";
// import { Track } from "livekit-client";
// import { Controls } from "@/components/livekit/Controls";
// import React from "react";
// import { LiveKitRoom } from "@livekit/components-react";

// /** Grid video yang simpel pakai useTracks -> LKTile trackRef */
// function VideoGrid() {
//   // Ambil track kamera & screenshare sebagai TrackReference[]
//   const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

//   if (!tracks.length) {
//     return (
//       <div className="w-full h-full grid place-items-center text-neutral-300">
//         Menunggu peserta…
//       </div>
//     );
//   }

//   return (
//     <div
//       className="w-full h-full p-3"
//       style={{
//         display: "grid",
//         gap: 12,
//         gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
//         alignItems: "stretch",
//       }}
//     >
//       {tracks.map((tr) => (
//         <div key={`${tr.participant.identity}-${tr.source}`} className="rounded overflow-hidden">
//           {/* INI penting: LKTile diberi trackRef */}
//           <LKTile trackRef={tr} />
//         </div>
//       ))}
//     </div>
//   );
// }

// export function RoomContainer({ token, serverUrl }: { token: string; serverUrl: string }) {
//   return (
//     <LiveKitRoom
//       token={token}
//       serverUrl={serverUrl}
//       connect
//       audio
//       video
//       onConnected={() => console.log("Connected to LiveKit room")}
//       style={{
//         height: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         backgroundColor: "#0b0b0b",
//         color: "#fff",
//       }}
//     >
//       {/* WAJIB: render audio remote supaya suara orang lain terdengar */}
//       <RoomAudioRenderer />

//       {/* Area video */}
//       <div className="flex-1 min-h-0">
//         <VideoGrid />
//       </div>

//       {/* Control bar (sudah kamu betulkan dengan useLocalParticipant) */}
//       <Controls />
//     </LiveKitRoom>
//   );
// }
