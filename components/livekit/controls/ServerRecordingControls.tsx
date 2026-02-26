"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

export function ServerRecordingControls({ roomName }: { roomName: string }) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [lastError, setLastError] = React.useState<string | null>(null);

    const RECORDER_API_BASE = "http://localhost:4000";

    const getJwt = () => {
        if (typeof window === "undefined") return "";
        return localStorage.getItem("vc_token") || "";
    };

    const startRecording = async () => {
        if (loading) return;
        setLoading(true);
        setLastError(null);

        try {
            const roomId = roomName; // The prop passed to this component is already the room code from the URL

            const res = await fetch(`${RECORDER_API_BASE}/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: roomName, roomCode: roomId }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setIsRecording(true);
        } catch (err: any) {
            console.error("[Recording] gagal start:", err);
            setLastError(err?.message || "Gagal mulai recording");
        } finally {
            setLoading(false);
        }
    };

    const stopRecording = async () => {
        if (loading) return;
        setLoading(true);
        setLastError(null);

        try {
            const res = await fetch(`${RECORDER_API_BASE}/stop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: roomName }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            setIsRecording(false);
        } catch (err: any) {
            console.error("[Recording] gagal stop:", err);
            setLastError(err?.message || "Gagal stop recording");
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
