"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DbRoom, Group } from "@/lib/api/admin-api"
import { createDbRoom, updateDbRoom } from "@/lib/api/admin-api"

interface RoomFormProps {
    initialData?: DbRoom | null
    groups: Group[]
    onSuccess: () => void
    onCancel: () => void
}

export function RoomForm({ initialData, groups, onSuccess, onCancel }: RoomFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        maxParticipants: 20,
        assignedToInput: "",
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
                assignedToInput: initialData.assigned_to?.join(", ") || "",
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
                assignedToInput: "",
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
            assignedTo: formData.assignedToInput
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                        placeholder="e.g. rafael, budi, siti"
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
