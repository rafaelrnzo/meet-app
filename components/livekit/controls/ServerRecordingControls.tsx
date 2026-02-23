"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

export function ServerRecordingControls({ roomName }: { roomName: string }) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [lastError, setLastError] = React.useState<string | null>(null);

    const API_BASE =
        process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
        "http://localhost:8080";

    const getJwt = () => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("vc_token") || "";
    };

    const startRecording = async () => {
        if (loading) return;
        setLoading(true);
        setLastError(null);

        try {
            const res = await fetch(`${API_BASE}/admin/livekit/recordings/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getJwt()}`,
                },
                body: JSON.stringify({ room_name: roomName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            await res.json().catch(() => ({} as any));
            setIsRecording(true);
        } catch (err: any) {
            console.error("[Recording] gagal start:", err);
            setLastError(err?.message || "Gagal mulai recording");
            // alert(`Gagal mulai recording: ${err?.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const stopRecording = async () => {
        if (loading) return;
        setLoading(true);
        setLastError(null);

        try {
            const res = await fetch(`${API_BASE}/admin/livekit/recordings/stop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getJwt()}`,
                },
                body: JSON.stringify({ room_name: roomName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const data = await res.json().catch(() => ({} as any));
            const status: string = data.status || "";

            if (
                status === "EGRESS_ABORTED" ||
                status === "EGRESS_COMPLETE" ||
                status === "EGRESS_FAILED"
            ) {
                setIsRecording(false);
                return;
            }

            setIsRecording(false);
        } catch (err: any) {
            console.error("[Recording] gagal stop:", err);
            setLastError(err?.message || "Gagal stop recording");
            // alert(`Gagal stop recording: ${err?.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 
            disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md relative
            ${isRecording
                        ? "bg-red-600 border-red-600 text-white hover:bg-red-700 ring-2 ring-red-500/30 animate-pulse"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <div className={`w-4 h-4 rounded-full ${isRecording ? "bg-white" : "bg-red-500"}`} />
                )}
            </button>
            {lastError && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {lastError}
                </span>
            )}
        </div>
    );
}
