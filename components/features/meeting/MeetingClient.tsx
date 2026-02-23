"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchToken, fetchPublicRoom, joinPublicRoom } from "@/lib/api/api";
import RoomContainer from "@/components/livekit/layout/RoomContainer";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PreJoin, { MediaChoices } from "./PreJoin";
import { toast } from "sonner";

export default function MeetingClient({ room: encodedRoom }: { room: string }) {
  const room = decodeURIComponent(encodedRoom);
  const searchParams = useSearchParams();

  const [identity, setIdentity] = useState(() => {
    const q = searchParams.get("identity");
    return q || `Guest-${Math.random().toString(36).slice(2, 6)}`;
  });

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");
  const [tokenParams, setTokenParams] = useState<{ roomName?: string; isWaiting?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Guest State
  const [isGuest, setIsGuest] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{ name: string; is_password_protected: boolean } | null>(null);

  const [preJoinChoices, setPreJoinChoices] = useState<MediaChoices | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setError(null);
        setLoading(true);

        const authToken = typeof window !== 'undefined' ? localStorage.getItem("vc_token") : null;

        if (authToken) {
          try {
            const data = await fetchToken(room, identity);
            if (!active) return;
            setToken(data.token);
            setServerUrl(data.serverUrl);
            setTokenParams({ roomName: data.roomName, isWaiting: data.isWaiting });

            if (data.identity) {
              setIdentity(data.identity);
            }

            setIsGuest(false);
            setLoading(false);
            return;
          } catch (e: any) {
            console.warn("Auth token present but fetch failed, falling back to public check", e);
            if (e.message) {
              toast.error(`Auth Error: ${e.message}`);
            }
            if (e.message?.includes("401")) {
              localStorage.removeItem("vc_token");
            }
          }
        }

        const info = await fetchPublicRoom(room);
        if (!active) return;

        if (info) {
          setRoomInfo(info);
          setIsGuest(true);
          setLoading(false);
        } else {
          throw new Error("Room not found");
        }

      } catch (e: any) {
        if (!active) return;
        console.error("Join error:", e);
        if (e.message && e.message.includes("409")) {
          const msg = e.message.split("-").pop()?.trim() || "Anda sedang berada di room lain.";
          setError(msg);
        } else {
          setError(e.message || "Gagal memuat room. Pastikan room ada dan Anda memiliki akses.");
        }
        setLoading(false);
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [room, identity]);

  const handleJoin = async (choices: MediaChoices) => {
    if (!isGuest) {
      setPreJoinChoices(choices);
      return;
    }

    try {
      setLoading(true);
      const data = await joinPublicRoom(room, choices.username, choices.password);

      setToken(data.token);
      setServerUrl(data.serverUrl);
      setTokenParams({ roomName: data.roomName, isWaiting: data.isWaiting });
      setPreJoinChoices(choices);
      setLoading(false);

    } catch (e: any) {
      console.error("Guest join failed", e);
      toast.error("Gagal masuk: " + e.message);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background text-foreground p-4">
        <div className="flex flex-col items-center max-w-md w-full gap-6 p-8 rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.href = '/'}
            >
              Back to Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || (!token && !roomInfo)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-xl font-semibold tracking-tight">Connecting to Room</h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              Securing connection to <span className="text-foreground font-medium">{room}</span>...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <PreJoin
        roomName={tokenParams?.roomName || roomInfo?.name || room}
        initialUsername={identity}
        onJoin={handleJoin}
        passwordRequired={isGuest && roomInfo?.is_password_protected}
        isLoading={loading}
        disableNameInput={!isGuest}
      />
    );
  }

  if (!token || !serverUrl) {
    return null;
  }

  return (
    <RoomContainer
      token={token}
      serverUrl={serverUrl}
      roomName={room}
      roomTitle={tokenParams?.roomName}
      initialIsWaiting={tokenParams?.isWaiting}
      initialMediaState={preJoinChoices}
    />
  );
}

