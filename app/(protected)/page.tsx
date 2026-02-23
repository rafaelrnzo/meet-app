"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, LayoutGrid, RefreshCcw, Calendar, Users, Copy } from "lucide-react"
import {
    fetchDbRooms,
    fetchActiveRooms,
    type DbRoom,
    type ActiveRoom,
    fetchUserDbRooms,
} from "@/lib/api/admin-api"
import { cn } from "@/lib/utils"
import { useAuth } from "../../hooks/use-auth"

export default function HomePage() {
    const router = useRouter()
    const { isAdmin, loading: authLoading } = useAuth()
    const [roomCodeInput, setRoomCodeInput] = useState("")
    const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
    const [dbUserRooms, setUserDbRooms] = useState<DbRoom[]>([])
    const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!authLoading) {
            loadData()
        }
    }, [authLoading, isAdmin])

    const loadData = async () => {
        setLoading(true)
        try {
            if (!isAdmin) {
                const [dbData, liveData] = await Promise.allSettled([fetchUserDbRooms(), fetchActiveRooms()])
                if (dbData.status === "fulfilled") setUserDbRooms(dbData.value || [])
                if (liveData.status === "fulfilled") setActiveRooms(liveData.value || [])
            } else {
                const [dbData, liveData] = await Promise.allSettled([fetchDbRooms(), fetchActiveRooms()])
                if (dbData.status === "fulfilled") setDbRooms(dbData.value || [])
                if (liveData.status === "fulfilled") setActiveRooms(liveData.value || [])
            }
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = (code?: string) => {
        const targetCode = typeof code === "string" ? code : roomCodeInput
        if (!targetCode.trim()) return
        router.push(`/meeting/${encodeURIComponent(targetCode)}`)
    }

    const displayedRooms = (isAdmin ? dbRooms : dbUserRooms).map((room) => ({
        ...room,
        isLive: !!activeRooms.find((ar) => ar.name === room.room_code),
        currentParticipants: activeRooms.find((ar) => ar.name === room.room_code)?.num_participants || 0,
    }))

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-base font-semibold">Quick Join</h2>
                    <p className="text-xs text-muted-foreground mt-1">Join an existing meeting instantly with a code.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Input
                        className="h-9 font-mono text-sm"
                        placeholder="Enter room code..."
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value)}
                    />
                    <Button onClick={() => handleJoin()} className="h-9">
                        Join
                    </Button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Available Rooms
                    </h3>
                    <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs">
                        <RefreshCcw className="h-3 w-3 mr-2" /> Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">Loading rooms...</div>
                ) : displayedRooms.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">No rooms available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedRooms.map((room) => {
                            const now = new Date()
                            const start = new Date(room.start_date)
                            const end = new Date(room.end_date)
                            const status = now < start ? "upcoming" : now > end ? "ended" : "open"
                            const isFull = room.currentParticipants >= room.max_participants

                            return (
                                <div
                                    key={room.id}
                                    className="group bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all relative"
                                >
                                    {room.isLive && (
                                        <span
                                            className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-500 animate-pulse"
                                            title="Live"
                                        />
                                    )}

                                    <div className="mb-3">
                                        <h4 className="text-sm font-semibold truncate pr-6">{room.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                            {room.description || "No description"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between bg-muted rounded px-3 py-2 border border-border mb-3">
                                        <code className="text-xs font-mono text-primary font-medium">{room.room_code}</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(room.room_code)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" /> {start.toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3 w-3" /> {room.currentParticipants}/{room.max_participants}
                                        </div>
                                    </div>

                                    <Button
                                        className={cn(
                                            "w-full h-8 text-xs font-medium",
                                            status === "open" && !isFull
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                                        )}
                                        disabled={status !== "open" || isFull}
                                        onClick={() => handleJoin(room.room_code)}
                                    >
                                        {status === "ended"
                                            ? "Ended"
                                            : status === "upcoming"
                                                ? "Scheduled"
                                                : isFull
                                                    ? "Full"
                                                    : "Enter Room"}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
