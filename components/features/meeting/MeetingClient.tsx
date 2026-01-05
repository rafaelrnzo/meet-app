// components/meeting/MeetingClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchToken } from "@/lib/api/api";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null); // Reset error before fetching
        const { token, serverUrl } = await fetchToken(room, identity);
        if (!active) return;
        setToken(token);
        setServerUrl(serverUrl);
      } catch (e: any) {
        console.error("fetchToken error:", e);
        if (e.message && e.message.includes("409")) {
          const msg = e.message.split("-").pop()?.trim() || "Anda sedang berada di room lain.";
          setError(msg);
        } else {
          alert("Gagal mengambil token. Cek backend /token & env (LIVEKIT_SERVER_URL).");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [room, identity]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-900 text-white p-4">
        <div className="bg-red-900/50 border border-red-500 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2 text-red-200">Akses Ditolak</h2>
          <p className="text-red-100 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'} // Or back to home
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

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
