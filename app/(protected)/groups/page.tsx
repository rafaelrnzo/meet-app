"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Trash2 } from "lucide-react"
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

export default function GroupsPage() {
    const { hasPermission } = useAuth()
    const canManage = hasPermission("groups", "manage")
    const [groups, setGroups] = useState<GroupDto[]>([])
    const [users, setUsers] = useState<UserDto[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [desc, setDesc] = useState("")
    const [manageGroupId, setManageGroupId] = useState<number | null>(null)
    const [selectedUserId, setSelectedUserId] = useState("")

    useEffect(() => {
        if (canManage || hasPermission("groups", "read")) loadData()
    }, [canManage])

    const loadData = async () => {
        const [g, u] = await Promise.all([fetchGroups(), fetchUsers()])
        setGroups(g || [])
        setUsers(u || [])
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        await createGroup({ name, description: desc })
        setIsOpen(false)
        setName("")
        setDesc("")
        loadData()
    }

    const handleAdd = async () => {
        if (manageGroupId && selectedUserId) {
            await addGroupMember(manageGroupId, Number(selectedUserId))
            loadData()
            setSelectedUserId("")
        }
    }

    if (!hasPermission("groups", "read")) return <div className="p-8 text-center text-muted-foreground">Unauthorized</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Groups</h2>
                {canManage && (
                    <Button onClick={() => setIsOpen(true)} size="sm" className="h-8">
                        <Plus className="h-3 w-3 mr-1.5" /> New Group
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card p-5 rounded-lg border border-border shadow-xl w-full max-w-sm">
                        <h3 className="font-semibold text-sm mb-4">Create Group</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input
                                className="h-9"
                                placeholder="Group Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Input
                                className="h-9"
                                placeholder="Description"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                    className="text-muted-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm">
                                    Create
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g) => (
                    <div key={g.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="text-sm font-semibold">{g.name}</h3>
                                <p className="text-xs text-muted-foreground">{g.description}</p>
                            </div>
                            {canManage && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        if (confirm("Delete?")) {
                                            await deleteGroup(g.id)
                                            loadData()
                                        }
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>

                        <div className="bg-muted border border-border rounded p-3">
                            <div className="flex gap-2 mb-2">
                                <select
                                    className="flex-1 h-7 text-xs rounded border border-border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={manageGroupId === g.id ? selectedUserId : ""}
                                    onChange={(e) => {
                                        setManageGroupId(g.id)
                                        setSelectedUserId(e.target.value)
                                    }}
                                >
                                    <option value="">Add member...</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.username}
                                        </option>
                                    ))}
                                </select>
                                {canManage && (
                                    <Button
                                        size="sm"
                                        onClick={handleAdd}
                                        disabled={!selectedUserId || manageGroupId !== g.id}
                                        className="h-7 w-7 p-0"
                                        variant="outline"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {g.members?.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground italic text-center py-2">
                                        No members
                                    </p>
                                )}
                                {g.members?.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex justify-between items-center text-xs bg-background px-2 py-1.5 rounded border border-border"
                                    >
                                        <span>{m.username}</span>
                                        <button
                                            onClick={async () => {
                                                await removeGroupMember(g.id, m.id)
                                                loadData()
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
