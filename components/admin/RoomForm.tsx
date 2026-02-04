"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { DbRoom, Group, User } from "@/lib/api/admin-api"
import { createDbRoom, updateDbRoom } from "@/lib/api/admin-api"

interface RoomFormProps {
    initialData?: DbRoom | null
    groups: Group[]
    users: User[]
    onSuccess: () => void
    onCancel: () => void
}

export function RoomForm({ initialData, groups, users, onSuccess, onCancel }: RoomFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        maxParticipants: 20,
        assignedTo: [] as string[],
        startDate: "",
        endDate: "",
        groupId: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description,
                maxParticipants: initialData.max_participants,
                assignedTo: initialData.assigned_to || [],
                startDate: formatDateForInput(initialData.start_date),
                endDate: formatDateForInput(initialData.end_date),
                groupId: initialData.group_id ? String(initialData.group_id) : "",
            })
        } else {
            // Reset form for new room
            setFormData({
                name: "",
                description: "",
                maxParticipants: 20,
                assignedTo: [],
                startDate: "",
                endDate: "",
                groupId: "",
            })
        }
    }, [initialData])

    const formatDateForInput = (iso?: string) =>
        iso
            ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : ""

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.startDate || !formData.endDate) return

        setIsSubmitting(true)
        const payload = {
            name: formData.name,
            description: formData.description,
            maxParticipants: formData.maxParticipants,
            assignedTo: formData.assignedTo,
            groupId: formData.groupId,
            startDate: formData.startDate,
            endDate: formData.endDate,
        }

        try {
            if (initialData) {
                await updateDbRoom(initialData.id, payload)
            } else {
                await createDbRoom(payload)
            }
            onSuccess()
        } catch (error) {
            console.error("Failed to save room:", error)
            alert("Failed to save room")
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleUser = (userId: string) => {
        setFormData(prev => {
            const current = prev.assignedTo
            if (current.includes(userId)) {
                return { ...prev, assignedTo: current.filter(id => id !== userId) }
            } else {
                return { ...prev, assignedTo: [...current, userId] }
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                    <Input
                        className="h-9"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                    />
                </div>
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                    <Input
                        className="h-9"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Assigned Users Selection */}
                <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                        Assigned Users (Optional)
                    </Label>
                    <div className="h-32 rounded-md border border-border p-2 overflow-y-auto space-y-2 bg-background">
                        {users.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-2">No users available</p>
                        ) : (
                            users.map(user => (
                                <div key={user.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`user-${user.id}`}
                                        checked={formData.assignedTo.includes(user.id.toString())}
                                        onCheckedChange={() => toggleUser(user.id.toString())}
                                    />
                                    <Label
                                        htmlFor={`user-${user.id}`}
                                        className="text-sm font-normal cursor-pointer w-full"
                                    >
                                        {user.username}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Input
                        type="datetime-local"
                        className="h-9"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <Input
                        type="datetime-local"
                        className="h-9"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Group</Label>
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
                    <Label className="text-xs font-medium text-muted-foreground">Max Participants</Label>
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
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="text-muted-foreground"
                >
                    Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                </Button>
            </div>
        </form>
    )
}
