"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCcw, Pencil, Link2, Trash2 } from "lucide-react"
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

    const canUpdate = hasPermission("recording:update")
    const canDelete = hasPermission("recording:delete")

    useEffect(() => {
        load()
    }, [])

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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Recordings</h2>
                <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs">
                    <RefreshCcw className="h-3 w-3 mr-2" /> Refresh
                </Button>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                {recordings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No recordings found</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted border-b border-border text-xs uppercase text-muted-foreground font-medium">
                            <tr>
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                            {recordings.map((r) => (
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
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <a
                                                href={r.link}
                                                target="_blank"
                                                className="p-1.5 text-primary hover:bg-primary/10 rounded"
                                            >
                                                <Link2 className="h-3.5 w-3.5" />
                                            </a>
                                            {canDelete && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Delete?")) {
                                                            await deleteRecording(r.id)
                                                            load()
                                                        }
                                                    }}
                                                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
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
                )}
            </div>
        </div>
    )
}
