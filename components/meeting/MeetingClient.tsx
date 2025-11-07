"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchToken } from "@/lib/api";
import { Loader } from "@/components/livekit/Loader";
import RoomContainer from "../livekit/RoomContainer";

export default function MeetingClient({ room }: { room: string }) {
  const searchParams = useSearchParams();
  const identity = searchParams.get("identity") || "anon";

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    fetchToken(room, identity)
      .then(({ token, serverUrl }) => {
        if (!active) return;
        setToken(token);
        setServerUrl(serverUrl);
      })
      .catch((e) => {
        console.error("fetchToken error:", e);
        alert("Gagal mengambil token. Cek backend /token & env.");
      });
    return () => {
      active = false;
    };
  }, [room, identity]);

  if (!token) return <Loader />;

  return <RoomContainer token={token} serverUrl={serverUrl} />;
}
