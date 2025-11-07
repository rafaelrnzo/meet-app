"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [room, setRoom] = useState("default-room");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!name.trim()) return alert("Masukkan nama kamu dulu");
    router.push(`/meeting/${encodeURIComponent(room)}?identity=${encodeURIComponent(name)}`);
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center gap-3 bg-neutral-900 text-white">
      <h1 className="text-3xl font-bold mb-4">🎥 LiveKit Meeting</h1>

      <input
        className="px-4 py-2 rounded text-black w-64"
        placeholder="Nama kamu..."
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="px-4 py-2 rounded text-black w-64"
        placeholder="Nama room..."
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <button
        onClick={handleJoin}
        className="mt-4 px-6 py-2 bg-blue-600 rounded text-white hover:bg-blue-500"
      >
        Join Meeting
      </button>
    </div>
  );
}
