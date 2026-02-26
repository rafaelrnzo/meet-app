"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Users, Shield, Clock, Trash2, Edit2, Copy, BarChart3, Settings, ChevronLeft, Ban, Unlock, FileText, Upload } from "lucide-react"
import type { DbRoom, ActiveRoom, Group, User } from "@/lib/api/admin-api"
import { unbanParticipant, uploadRoomPresentation, updateRoomPermissions } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// Using native HTML/Tailwind for maximum flexibility as requested for "Premium UI"
import { RoomForm } from "./RoomForm"

interface RoomDetailSheetProps {
    room: DbRoom | null
    activeRoom?: ActiveRoom
    isOpen: boolean
    onClose: () => void
    onDelete: (id: number) => void
    onEditSuccess: () => void // Callback to refresh data
    groups: Group[]
    users: User[]
}

export function RoomDetailSheet({ room, activeRoom, isOpen, onClose, onDelete, onEditSuccess, groups, users }: RoomDetailSheetProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "participants" | "settings">("overview")
    const [isEditing, setIsEditing] = useState(false)

    // Helper to construct full URL for presentations
    const getPresentationUrl = (path: string | undefined): string => {
        if (!path) return "";

        // If already a full URL (http/https), return as-is (backward compatibility)
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }

        // If relative path, prepend backend URL
        const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
            (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8080` : "http://localhost:8080");

        return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
    }

    // Reset tab and editing state when room changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab("overview")
            setIsEditing(false)
        }
    }, [isOpen, room])

    return (
        <AnimatePresence>
            {isOpen && room && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        {...({
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 },
                            onClick: onClose,
                            className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        } as any)}
                    />

                    {/* Sheet */}
                    <motion.div
                        {...({
                            initial: { x: "100%" },
                            animate: { x: 0 },
                            exit: { x: "100%" },
                            transition: { type: "spring", damping: 25, stiffness: 200 },
                            className: "fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
                        } as any)}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
                            <div className="flex items-center gap-3">
                                {isEditing && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-1 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                )}
                                <div>
                                    <motion.h2
                                        {...({ layoutId: `room-title-${room.id}` } as any)}
                                        className="text-xl font-bold"
                                    >
                                        {isEditing ? "Edit Room" : room.name}
                                    </motion.h2>
                                    {!isEditing && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            ID: {room.room_code || room.id}
                                            <button
                                                className="hover:text-foreground transition-colors"
                                                onClick={() => navigator.clipboard.writeText(room.name)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                        title="Edit Room"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {isEditing ? (
                            <div className="flex-1 overflow-y-auto p-6 animate-in slide-in-from-right-4 duration-300">
                                <RoomForm
                                    initialData={room}
                                    groups={groups}
                                    users={users}
                                    onSuccess={() => {
                                        setIsEditing(false)
                                        onEditSuccess()
                                    }}
                                    onCancel={() => setIsEditing(false)}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div className="flex items-center px-6 border-b border-border gap-6 text-sm font-medium">
                                    <button
                                        onClick={() => setActiveTab("overview")}
                                        className={cn(
                                            "py-4 relative transition-colors",
                                            activeTab === "overview" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Overview
                                        {activeTab === "overview" && (
                                            <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" {...({ layoutId: "activeTab" } as any)} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("participants")}
                                        className={cn(
                                            "py-4 relative transition-colors",
                                            activeTab === "participants" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        People & Access
                                        {activeTab === "participants" && (
                                            <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" {...({ layoutId: "activeTab" } as any)} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("settings")}
                                        className={cn(
                                            "py-4 relative transition-colors",
                                            activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Settings
                                        {activeTab === "settings" && (
                                            <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" {...({ layoutId: "activeTab" } as any)} />
                                        )}
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {activeTab === "overview" && (
                                        <>
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                {/* Status Card */}
                                                <div className={cn(
                                                    "p-4 rounded-xl border flex items-center justify-between",
                                                    activeRoom
                                                        ? "bg-green-500/5 border-green-500/20"
                                                        : "bg-muted/30 border-border"
                                                )}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                                            activeRoom ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            <BarChart3 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm">
                                                                {activeRoom ? "Session Active" : "Room Idle"}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {activeRoom
                                                                    ? `Started ${new Date(activeRoom.creation_time * 1000).toLocaleTimeString()}`
                                                                    : "No active meeting session"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {activeRoom && (
                                                        <div className="text-right">
                                                            <span className="text-2xl font-bold text-green-600">{activeRoom.num_participants}</span>
                                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Online</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-xs font-semibold uppercase">Created</span>
                                                        </div>
                                                        <p className="text-sm font-medium">
                                                            {room.created_at ? new Date(room.created_at).toLocaleString() : "-"}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                            <Users className="h-4 w-4" />
                                                            <span className="text-xs font-semibold uppercase">Max Capacity</span>
                                                        </div>
                                                        <p className="text-sm font-medium">
                                                            {room.max_participants} Participants
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-sm font-semibold text-foreground">Description</h3>
                                                    <div className="p-4 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
                                                        {room.description || "No description set for this room."}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-semibold text-foreground">Presentation</h3>
                                                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                                                    {room.presentation_path ? (
                                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="h-8 w-8 rounded bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="h-4 w-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium truncate max-w-[200px]">
                                                                        {room.presentation_path.split('/').pop()}
                                                                    </p>
                                                                    <a
                                                                        href={getPresentationUrl(room.presentation_path)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs text-primary hover:underline"
                                                                    >
                                                                        View PDF
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center border border-dashed border-border rounded-lg bg-muted/30">
                                                            <p className="text-sm text-muted-foreground">No presentation uploaded</p>
                                                        </div>
                                                    )}

                                                    <div className="pt-2">
                                                        <label className="flex flex-col gap-2">
                                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Update Presentation (PDF)</span>
                                                            <input
                                                                type="file"
                                                                accept="application/pdf"
                                                                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (!file) return

                                                                    if (file.type !== "application/pdf") {
                                                                        toast.error("Please upload a valid PDF file")
                                                                        return
                                                                    }

                                                                    try {
                                                                        toast.loading("Uploading presentation...")
                                                                        const { path } = await uploadRoomPresentation(room.id, file)

                                                                        // If room is active, update metadata to sync immediately
                                                                        if (activeRoom) {
                                                                            try {
                                                                                const currentMeta = activeRoom.metadata ? JSON.parse(activeRoom.metadata) : {}
                                                                                const newMeta = {
                                                                                    ...currentMeta,
                                                                                    presentation: {
                                                                                        isOpen: true,
                                                                                        url: path
                                                                                    }
                                                                                }
                                                                                await updateRoomPermissions(room.name, newMeta)
                                                                                toast.success("Presentation synced to active meeting")
                                                                            } catch (err) {
                                                                                console.error("Failed to sync metadata", err)
                                                                            }
                                                                        }

                                                                        toast.dismiss()
                                                                        toast.success("Presentation uploaded successfully")
                                                                        onEditSuccess()
                                                                    } catch (error) {
                                                                        toast.dismiss()
                                                                        toast.error("Failed to upload presentation")
                                                                        console.error(error)
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeTab === "participants" && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                            {/* Authorized Users Section */}
                                            <div>
                                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    Authorized Participants
                                                </h3>
                                                <div className="rounded-xl border border-border bg-card overflow-hidden">
                                                    {(!room.assigned_to || room.assigned_to.length === 0) ? (
                                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                                            <p>No specific users assigned.</p>
                                                            <p className="text-xs opacity-70 mt-1">This room is likely open or public.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-border">
                                                            {room.assigned_to.map((userIdOrName, idx) => {
                                                                // Try to find user if it's an ID
                                                                const user = users.find(u => u.id.toString() === userIdOrName || u.username === userIdOrName)
                                                                const displayName = user ? user.username : userIdOrName

                                                                return (
                                                                    <div key={idx} className="p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                                                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                                            {displayName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="text-sm font-medium">{displayName}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Admins Section */}
                                            <div>
                                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                                    <Shield className="h-4 w-4 text-orange-500" />
                                                    Room Admins
                                                </h3>
                                                <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">System Administrators</p>
                                                        <p className="text-xs text-muted-foreground">Full access control</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Banned Users Section */}
                                            {room.banned_users && room.banned_users.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-destructive">
                                                        <Ban className="h-4 w-4" />
                                                        Banned Users
                                                    </h3>
                                                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden divide-y divide-destructive/10">
                                                        {room.banned_users.map((user, idx) => (
                                                            <div key={idx} className="p-3 flex items-center justify-between hover:bg-destructive/10 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">
                                                                        <Ban className="h-4 w-4" />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-destructive">{user}</span>
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            await unbanParticipant(room.room_code, user)
                                                                            toast.success(`Unbanned ${user}`)
                                                                            onEditSuccess()
                                                                        } catch (e) {
                                                                            toast.error("Failed to unban user")
                                                                        }
                                                                    }}
                                                                    className="p-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-muted transition-colors flex items-center gap-1"
                                                                >
                                                                    <Unlock className="w-3 h-3" />
                                                                    Unban
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "settings" && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4">
                                                <div className="flex items-center gap-2 text-destructive font-semibold">
                                                    <Trash2 className="h-4 w-4" />
                                                    Danger Zone
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Deleting this room will permanently remove it and disconnect any active participants.
                                                </p>
                                                <button
                                                    onClick={() => onDelete(room.id)}
                                                    className="w-full py-2 px-4 rounded-lg bg-white text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all text-sm font-medium shadow-sm"
                                                >
                                                    Delete Room
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-border bg-muted/10">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    )
}
