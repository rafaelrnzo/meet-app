"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [room, setRoom] = useState("default-room");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (!name.trim()) return alert("Masukkan nama kamu dulu");
    router.push(`/meeting/${encodeURIComponent(room)}?identity=${encodeURIComponent(name)}`);
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-br from-[#0f0f10] via-[#18181b] to-[#0f0f10] text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#1f1f23] rounded-2xl shadow-2xl p-8 flex flex-col gap-5 border border-neutral-700/50"
      >
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-2 flex justify-center items-center gap-2">
            <span>LiveKit Custom Meeting</span>
          </h1>
          <p className="text-neutral-400 text-sm">
            Masukkan nama dan room untuk bergabung ke meeting.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <input
            className="px-4 py-3 rounded-xl bg-neutral-900/60 text-white placeholder-neutral-500 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Nama kamu..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-xl bg-neutral-900/60 text-white placeholder-neutral-500 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Nama room..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleJoin}
          className="mt-6 px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold hover:bg-blue-500 active:bg-blue-700 transition-all shadow-lg"
        >
          Join Meeting
        </motion.button>
      </motion.div>
    </div>
  );
}
