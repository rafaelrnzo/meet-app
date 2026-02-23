// app/meeting/[room]/page.tsx
import { Suspense } from "react";
import MeetingClient from "@/components/features/meeting/MeetingClient";
import { Loader } from "@/components/livekit/layout/Loader";

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ room: string }>;
  searchParams: Promise<{ identity?: string }>;
}) {
  const { room } = await params;

  if (!room || !room.trim()) {
    return (
      <div style={{ padding: 24, color: "#eee", background: "#111", height: "100vh" }}>
        <h3>Param room kosong.</h3>
        <p>
          Buka URL seperti: <code>/meeting/default-room?identity=nama</code>
        </p>
        <p>Contoh: <code>/meeting/default-room?identity=test</code></p>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loader text="Preparing meeting..." />}>
      <MeetingClient room={room} />
    </Suspense>
  );
}
