"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Users, Settings, Search, UserPlus, X } from "lucide-react"
import {
    fetchGroups,
    createGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    fetchUsers,
    type Group as GroupDto,
    type User as UserDto,
} from "@/lib/api/admin-api"
import { useAuth } from "../../../hooks/use-auth"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function GroupsPage() {
    const { hasPermission, loading } = useAuth()
    const [groups, setGroups] = useState<GroupDto[]>([])
    const [users, setUsers] = useState<UserDto[]>([])

    // Create Group State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ name: "", description: "" })

    // Manage Members State
    const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null)
    const [isManageOpen, setIsManageOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [g, u] = await Promise.all([fetchGroups(), fetchUsers()])
        setGroups(g || [])
        setUsers(u || [])
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        await createGroup(createForm)
        setIsCreateOpen(false)
        setCreateForm({ name: "", description: "" })
        loadData()
    }

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this group? This cannot be undone.")) {
            await deleteGroup(id)
            loadData()
        }
    }

    const openManage = (g: GroupDto) => {
        setSelectedGroup(g)
        setIsManageOpen(true)
        setSelectedUserId("")
    }

    const handleAddMember = async () => {
        if (!selectedGroup || !selectedUserId) return
        await addGroupMember(selectedGroup.id, Number(selectedUserId))

        // Refresh data
        const updatedGroups = await fetchGroups()
        setGroups(updatedGroups || [])

        // Update selected group reference
        const updatedSelected = updatedGroups?.find(g => g.id === selectedGroup.id)
        if (updatedSelected) setSelectedGroup(updatedSelected)

        setSelectedUserId("")
    }

    const handleRemoveMember = async (userId: number) => {
        if (!selectedGroup) return
        await removeGroupMember(selectedGroup.id, userId)

        // Refresh data
        const updatedGroups = await fetchGroups()
        setGroups(updatedGroups || [])

        // Update selected group reference
        const updatedSelected = updatedGroups?.find(g => g.id === selectedGroup.id)
        if (updatedSelected) setSelectedGroup(updatedSelected)
    }

    // Filter users not in the group
    const availableUsers = users.filter(u =>
        !selectedGroup?.members?.some(m => m.id === u.id)
    )

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Teams & Groups</h2>
                    <p className="text-muted-foreground text-sm">Organize users into teams for easier management.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="h-9 gap-2">
                    <Plus className="h-4 w-4" /> New Group
                </Button>
            </div>

            {/* Groups Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[200px]">Group Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Description</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px] text-center">Members</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[150px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {groups.map((group) => (
                                <tr key={group.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            {group.name}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">{group.description || "-"}</td>
                                    <td className="p-4 align-middle text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            {group.members?.length || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => openManage(group)}
                                            >
                                                <Settings className="h-3.5 w-3.5 mr-1.5" /> Manage
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(group.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {groups.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No groups created yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Group Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                        <DialogDescription>
                            Create a group to organize users.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-3">
                            <Label>Name</Label>
                            <Input
                                placeholder="e.g. Engineering"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                            <Label>Description</Label>
                            <Input
                                placeholder="Group description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Group</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Members Dialog */}
            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Members</DialogTitle>
                        <DialogDescription>
                            Add or remove users from <span className="font-semibold text-foreground">{selectedGroup?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Add Member */}
                        <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-lg border border-border">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs">Add User</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">Select a user...</option>
                                    {availableUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={handleAddMember} disabled={!selectedUserId} className="h-9">
                                <UserPlus className="h-4 w-4 mr-2" /> Add
                            </Button>
                        </div>

                        {/* Member List */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                                Current Members ({selectedGroup?.members?.length || 0})
                            </Label>
                            <div className="border border-border rounded-lg divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                                {selectedGroup?.members?.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                                {member.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{member.username}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveMember(member.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {!selectedGroup?.members?.length && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No members in this group.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
