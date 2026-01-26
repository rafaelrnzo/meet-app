"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, DataPacket_Kind } from "livekit-client";

type Reaction = {
    id: string;
    emoji: string;
    x: number;
    senderName: string;
};

export function ReactionOverlay() {
    const room = useRoomContext();
    const [reactions, setReactions] = useState<Reaction[]>([]);

    const addReaction = useCallback((emoji: string, senderName: string) => {
        const id = Math.random().toString(36).slice(2);
        const x = 10 + Math.random() * 80;
        setReactions((prev) => [...prev, { id, emoji, x, senderName }]);

        setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 4000);
    }, []);

    useEffect(() => {
        const handleLocal = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && detail.emoji) {
                addReaction(detail.emoji, "You");
            }
        };
        window.addEventListener("local-reaction", handleLocal);
        return () => window.removeEventListener("local-reaction", handleLocal);
    }, [addReaction]);

    useEffect(() => {
        if (!room) return;

        const onData = (
            payload: Uint8Array,
            participant?: any,
            kind?: DataPacket_Kind,
            topic?: string
        ) => {
            try {
                const str = new TextDecoder().decode(payload);
                const data = JSON.parse(str);
                if (data.type === "reaction" && data.emoji) {
                    const senderName = participant?.name || participant?.identity || "Unknown";
                    addReaction(data.emoji, senderName);
                }
            } catch (e) {
                // ignore non-json or irrelavant data
            }
        };

        room.on(RoomEvent.DataReceived, onData);
        return () => {
            room.off(RoomEvent.DataReceived, onData);
        };
    }, [room, addReaction]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {reactions.map((r) => (
                <div
                    key={r.id}
                    className="absolute bottom-20 flex flex-col items-center animate-float-up opacity-0"
                    style={{
                        left: `${r.x}%`,
                        animation: "flyUp 3s ease-out forwards",
                    }}
                >
                    <div className="text-4xl">{r.emoji}</div>
                    <div className="text-[10px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-sm whitespace-nowrap">
                        {r.senderName}
                    </div>
                </div>
            ))}
            <style jsx>{`
        @keyframes flyUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-300px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
