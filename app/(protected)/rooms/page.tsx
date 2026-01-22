"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Pencil, Trash2 } from "lucide-react"
import {
    fetchDbRooms,
    createDbRoom,
    updateDbRoom,
    deleteDbRoom,
    fetchGroups,
    type DbRoom,
    type Group as GroupDto,
} from "@/lib/api/admin-api"
import { useAuth } from "../../../hooks/use-auth"

export default function RoomsPage() {
    const { hasPermission } = useAuth()
    const canManage = hasPermission("rooms", "manage")
    const [rooms, setRooms] = useState<DbRoom[]>([])
    const [groups, setGroups] = useState<GroupDto[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<DbRoom | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        maxParticipants: 20,
        assignedToInput: "",
        startDate: "",
        endDate: "",
        groupId: "",
    })

    useEffect(() => {
        if (canManage || hasPermission("rooms", "read")) loadData()
    }, [canManage])

    const loadData = async () => {
        const [r, g] = await Promise.all([fetchDbRooms(), fetchGroups()])
        setRooms(r || [])
        setGroups(g || [])
    }

    const formatDateForInput = (iso?: string) =>
        iso
            ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : ""

    const openModal = (room?: DbRoom) => {
        setEditingRoom(room || null)
        setFormData(
            room
                ? {
                    name: room.name,
                    description: room.description,
                    maxParticipants: room.max_participants,
                    assignedToInput: room.assigned_to?.join(", ") || "",
                    startDate: formatDateForInput(room.start_date),
                    endDate: formatDateForInput(room.end_date),
                    groupId: room.group_id ? String(room.group_id) : "",
                }
                : {
                    name: "",
                    description: "",
                    maxParticipants: 20,
                    assignedToInput: "",
                    startDate: "",
                    endDate: "",
                    groupId: "",
                }
        )
        setIsOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.startDate || !formData.endDate) return

        const payload = {
            name: formData.name,
            description: formData.description,
            maxParticipants: formData.maxParticipants,
            assignedTo: formData.assignedToInput
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            groupId: formData.groupId,
            startDate: formData.startDate,
            endDate: formData.endDate,
        }

        if (editingRoom) {
            await updateDbRoom(editingRoom.id, payload)
        } else {
            await createDbRoom(payload)
        }
        setIsOpen(false)
        loadData()
    }

    const handleDelete = async (id: number) => {
        if (confirm("Delete this room?")) {
            await deleteDbRoom(id)
            loadData()
        }
    }

    if (!hasPermission("rooms", "read")) return <div className="p-8 text-center text-muted-foreground">Unauthorized</div>

    // Only show create button when canManage is true


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Rooms</h2>
                {canManage && (
                    <Button onClick={() => openModal()} size="sm" className="h-8">
                        <Plus className="h-3 w-3 mr-1.5" /> New Room
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-lg shadow-2xl w-full max-w-xl border border-border animate-in zoom-in-95">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-border">
                            <h3 className="font-semibold text-sm">{editingRoom ? "Update Room" : "Create Room"}</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                                    <Input
                                        className="h-9"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                                    <Input
                                        className="h-9"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                {/* Assigned To input */}
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Assigned To (usernames, comma separated, optional)
                                    </label>
                                    <Input
                                        className="h-9"
                                        placeholder="contoh: rafael, budi, siti"
                                        value={formData.assignedToInput}
                                        onChange={(e) =>
                                            setFormData({ ...formData, assignedToInput: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                    <Input
                                        type="datetime-local"
                                        className="h-9"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">End Date</label>
                                    <Input
                                        type="datetime-local"
                                        className="h-9"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Group</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.groupId}
                                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                    >
                                        <option value="">Public / Individual</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Max Participants</label>
                                    <Input
                                        type="number"
                                        className="h-9"
                                        value={formData.maxParticipants}
                                        onChange={(e) =>
                                            setFormData({ ...formData, maxParticipants: Number(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-muted-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                                    Save
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted border-b border-border text-xs uppercase text-muted-foreground font-medium">
                        <tr>
                            <th className="px-5 py-3">Room</th>
                            <th className="px-5 py-3">Access</th>
                            <th className="px-5 py-3">Schedule</th>
                            <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                        {rooms.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                                    No rooms found
                                </td>
                            </tr>
                        ) : (
                            rooms.map((room) => (
                                <tr key={room.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-medium">{room.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                            {room.room_code}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {room.group ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                                                GROUP: {room.group.name}
                                            </span>
                                        ) : room.assigned_to?.length ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                                                PRIVATE
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                                PUBLIC
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                        <div>{new Date(room.start_date).toLocaleString()}</div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end gap-1">
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openModal(room)}
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(room.id)}
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
