"use client"

import { motion } from "framer-motion"
import { Users, Calendar, MoreVertical, PlayCircle, StopCircle } from "lucide-react"
import type { DbRoom, ActiveRoom } from "@/lib/api/admin-api"
import { cn } from "@/lib/utils"

interface RoomCardProps {
    room: DbRoom
    activeRoom?: ActiveRoom
    onClick: () => void
    onDelete: (e: React.MouseEvent) => void
}

export function RoomCard({ room, activeRoom, onClick, onDelete }: RoomCardProps) {
    const isActive = !!activeRoom

    return (
        <motion.div
            {...({ layoutId: `room-${room.id}` } as any)}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-5 text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer",
                isActive ? "border-primary/50 shadow-primary/10" : "border-border"
            )}
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onDelete}
                    className="rounded-full p-2 hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete Room"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg leading-tight tracking-tight">
                            {room.name}
                        </h3>
                        {isActive && (
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {room.description || "No description provided"}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-lg">
                        <Users className="h-4 w-4" />
                        <span className="font-medium text-foreground">
                            {isActive ? activeRoom.num_participants : 0}
                        </span>
                        <span className="text-xs">/ {room.max_participants}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-lg">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">
                            {new Date(room.created_at || Date.now()).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Footer / Status */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                        isActive
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground border-transparent"
                    )}>
                        {isActive ? "Live Now" : "Idle"}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        View Details →
                    </motion.div>
                </div>
            </div>

            {/* Decorative gradient blob */}
            <div
                className={cn(
                    "absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-all duration-500",
                    isActive && "bg-green-500/10"
                )}
            />
        </motion.div>
    )
}
