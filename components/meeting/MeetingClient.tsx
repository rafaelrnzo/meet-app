// components/meeting/MeetingClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchToken } from "@/lib/api";
import { Loader } from "@/components/livekit/Loader";
import RoomContainer from "@/components/livekit/RoomContainer";

export default function MeetingClient({ room }: { room: string }) {
  const searchParams = useSearchParams();

  const identity = useMemo(() => {
    const q = searchParams.get("identity");
    if (q && q.trim()) return q.trim();
    return `user-${Math.random().toString(36).slice(2, 8)}`;
  }, [searchParams]);

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { token, serverUrl } = await fetchToken(room, identity);
        if (!active) return;
        setToken(token);
        setServerUrl(serverUrl);
      } catch (e) {
        console.error("fetchToken error:", e);
        alert("Gagal mengambil token. Cek backend /token & env (LIVEKIT_SERVER_URL).");
      }
    })();
    return () => {
      active = false;
    };
  }, [room, identity]);

  if (!token || !serverUrl) {
    return <Loader text="🔄 Connecting to meeting..." />;
  }

  return (
    <RoomContainer 
      token={token} 
      serverUrl={serverUrl} 
      roomName={room} 
    />
  );
}