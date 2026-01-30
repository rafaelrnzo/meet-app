"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import {
    fetchUsers,
    createUser,
    updateUserRole,
    deleteUser,
    fetchRoles,
    type User as UserDto,
    type Role as RoleDto,
} from "@/lib/api/admin-api"
import { useAuth } from "../../../hooks/use-auth"

export default function UsersPage() {
    const { hasPermission } = useAuth({ requirePermission: "user:read" })
    const [users, setUsers] = useState<UserDto[]>([])
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({ username: "", password: "", role_id: 0 })

    const canCreate = hasPermission("user:create")
    const canUpdate = hasPermission("user:update")
    const canDelete = hasPermission("user:delete")

    useEffect(() => {
        loadData()
        loadRoles()
    }, [])

    const loadData = async () => {
        const d = await fetchUsers()
        setUsers(d || [])
    }

    const loadRoles = async () => {
        const r = await fetchRoles()
        setRoles(r || [])
        // Set default role to the first one if available
        if (r && r.length > 0) {
            setFormData(prev => ({ ...prev, role_id: r[0].id }))
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        await createUser(formData)
        setIsOpen(false)
        setFormData({ username: "", password: "", role_id: roles[0]?.id || 0 })
        loadData()
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Users</h2>
                {canCreate && (
                    <Button onClick={() => setIsOpen(true)} size="sm" className="h-8">
                        <Plus className="h-3 w-3 mr-1.5" /> New User
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card p-5 rounded-lg border border-border shadow-xl w-full max-w-sm">
                        <h3 className="font-semibold text-sm mb-4">Add User</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input
                                className="h-9"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <Input
                                className="h-9"
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <select
                                className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
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

            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted border-b border-border text-xs uppercase text-muted-foreground font-medium">
                        <tr>
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-muted/50">
                                <td className="px-5 py-3 font-medium">{u.username}</td>
                                <td className="px-5 py-3">
                                    <select
                                        className="h-6 text-xs bg-transparent border-none focus:ring-0 text-muted-foreground cursor-pointer"
                                        value={u.role_id || u.role?.id}
                                        onChange={async (e) => {
                                            await updateUserRole(u.id, Number(e.target.value))
                                            loadData()
                                        }}
                                        disabled={!canUpdate}
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to delete this user? This will remove them from all groups and cannot be undone.")) {
                                                    await deleteUser(u.id)
                                                    loadData()
                                                }
                                            }}
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
