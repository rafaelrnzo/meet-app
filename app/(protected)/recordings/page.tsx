"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCcw, Pencil, Link2, Trash2, Folder, ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react"
import {
    fetchRecordings,
    syncRecordings,
    updateRecordingName,
    deleteRecording,
    type Recording as RecordingDto,
} from "@/lib/api/admin-api"
import { useAuth } from "../../../hooks/use-auth"

export default function RecordingsPage() {
    const { hasPermission } = useAuth({ requirePermission: "recording:read" })
    const [recordings, setRecordings] = useState<RecordingDto[]>([])
    const [renamingId, setRenamingId] = useState<number | null>(null)
    const [val, setVal] = useState("")
    const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})

    // progress state per egressId
    const [progressMap, setProgressMap] = useState<Record<string, number>>({})

    const canUpdate = hasPermission("recording:update")
    const canDelete = hasPermission("recording:delete")

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        // Poll for progress for PROCESSING recordings
        const processingRecordings = recordings.filter(r => r.status === "PROCESSING");
        if (processingRecordings.length === 0) return;

        const interval = setInterval(() => {
            processingRecordings.forEach(r => {
                fetch(`http://localhost:4000/progress/${r.egress_id}`)
                    .then(res => res.json())
                    .then(async data => {
                        if (data.progress !== undefined) {
                            setProgressMap(prev => ({ ...prev, [r.egress_id]: data.progress }));
                        }
                        if (data.status === "COMPLETED") {
                            // If completed, update the backend DB to COMPLETED
                            try {
                                const { updateRecordingStatus } = await import("@/lib/api/admin-api");
                                await updateRecordingStatus(r.id, "COMPLETED");
                            } catch (e) {
                                console.error("Failed to update status in DB", e);
                            }
                            load();
                        } else if (data.status === "ERROR") {
                            // Also handle extraction failures
                            try {
                                const { updateRecordingStatus } = await import("@/lib/api/admin-api");
                                await updateRecordingStatus(r.id, "ERROR");
                            } catch (e) { }
                            load();
                        }
                    })
                    .catch(e => console.error("Poll failed", e));
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [recordings]);

    const load = async () => {
        await syncRecordings()
        setRecordings((await fetchRecordings()) || [])
    }

    const handleRename = async (id: number) => {
        if (val) {
            await updateRecordingName(id, val)
            setRenamingId(null)
            load()
        }
    }

    const handleDownload = async (url: string, filename: string) => {
        try {
            // Fetch the file as a blob to force download instead of opening in browser
            const response = await fetch(url)
            const blob = await response.blob()

            // Create a blob URL and trigger download
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = filename || 'recording.mp4'

            document.body.appendChild(a)
            a.click()

            // Cleanup
            window.URL.revokeObjectURL(blobUrl)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback: just open in new tab if fetch fails (e.g., due to CORS)
            window.open(url, '_blank')
        }
    }

    const toggleRoom = (roomId: string) => {
        setExpandedRooms(prev => ({
            ...prev,
            [roomId]: prev[roomId] === undefined ? false : !prev[roomId]
        }))
    }

    const groupedRecordings = useMemo(() => {
        return recordings.reduce((acc, current) => {
            const roomId = current.room_id || 'Unknown Room'
            if (!acc[roomId]) {
                acc[roomId] = []
            }
            acc[roomId].push(current)
            return acc
        }, {} as Record<string, RecordingDto[]>)
    }, [recordings])

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Recordings</h2>
                <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs">
                    <RefreshCcw className="h-3 w-3 mr-2" /> Refresh
                </Button>
            </div>

            {recordings.length === 0 ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm p-8 text-center text-muted-foreground text-sm">
                    No recordings found
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedRecordings).map(([roomId, roomRecordings]) => {
                        const isExpanded = expandedRooms[roomId] !== false // Default to true if not explicitly collapsed
                        return (
                            <div key={roomId} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleRoom(roomId)}
                                    className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-sm">Room: {roomId}</span>
                                        <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium ml-2">
                                            {roomRecordings.length} {roomRecordings.length === 1 ? 'recording' : 'recordings'}
                                        </span>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted border-b border-y border-border text-xs uppercase text-muted-foreground font-medium">
                                                <tr>
                                                    <th className="px-5 py-3">Name</th>
                                                    <th className="px-5 py-3">Date</th>
                                                    <th className="px-5 py-3">Status</th>
                                                    <th className="px-5 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/70">
                                                {roomRecordings.map((r) => (
                                                    <tr key={r.id} className="hover:bg-muted/50">
                                                        <td className="px-5 py-3">
                                                            {renamingId === r.id ? (
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        className="h-7 text-xs"
                                                                        value={val}
                                                                        onChange={(e) => setVal(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <Button size="sm" className="h-7" onClick={() => handleRename(r.id)}>
                                                                        ✓
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 font-medium">
                                                                    {r.name}
                                                                    {canUpdate && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setRenamingId(r.id)
                                                                                setVal(r.name)
                                                                            }}
                                                                            className="text-muted-foreground hover:text-primary"
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-muted-foreground">
                                                            {new Date(r.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-5 py-3 text-xs flex items-center gap-2">
                                                            {r.status === "PROCESSING" ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                                    <span className="text-primary font-medium animate-pulse">
                                                                        Extracting ({progressMap[r.egress_id] ?? 0}%)
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-green-600 font-medium">Ready</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {r.status !== "PROCESSING" && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleDownload(r.link, r.name.includes('.mp4') ? r.name : `${r.name}.mp4`)}
                                                                            className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <a
                                                                            href={r.link}
                                                                            target="_blank"
                                                                            className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                                                            title="Open Link"
                                                                        >
                                                                            <Link2 className="h-3.5 w-3.5" />
                                                                        </a>
                                                                    </>
                                                                )}
                                                                {canDelete && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm("Delete?")) {
                                                                                await deleteRecording(r.id)
                                                                                load()
                                                                            }
                                                                        }}
                                                                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
