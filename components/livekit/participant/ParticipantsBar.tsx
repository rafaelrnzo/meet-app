"use client";
import { useParticipants } from "@livekit/components-react";

export function ParticipantsBar() {
  const participants = useParticipants();
  return (
    <div className="text-xs text-neutral-400 px-3 py-1 border-b border-neutral-800">
      participants: {participants.length} → {participants.map(p => p.identity).join(", ") || "—"}
    </div>
  );
}
