"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Shield, Settings } from "lucide-react"
import {
    fetchRoles,
    createRole,
    deleteRole,
    fetchPermissions,
    addRolePermission,
    removeRolePermission,
    type Role,
    type Permission,
} from "@/lib/api/admin-api"
import { useAuth } from "../../../hooks/use-auth"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function RolesPage() {
    const { hasPermission, loading, user } = useAuth()
    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])

    // Create Role State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ name: "", description: "" })

    // Manage Permissions State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isManageOpen, setIsManageOpen] = useState(false)

    const canRead = hasPermission("role:read")
    const canCreate = hasPermission("role:create")
    const canUpdate = hasPermission("role:update")
    const canDelete = hasPermission("role:delete")

    useEffect(() => {
        if (canRead) {
            loadRoles()
            loadPermissions()
        }
    }, [canRead])

    const loadRoles = async () => {
        const data = await fetchRoles()
        setRoles(data || [])
    }

    const loadPermissions = async () => {
        const data = await fetchPermissions()
        setPermissions(data || [])
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        await createRole(createForm)
        setIsCreateOpen(false)
        setCreateForm({ name: "", description: "" })
        loadRoles()
    }

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this role? This cannot be undone.")) {
            await deleteRole(id)
            loadRoles()
        }
    }

    const togglePermission = async (permId: number, checked: boolean) => {
        if (!selectedRole) return

        // Optimistic update
        const currentPerms = selectedRole.permissions || []
        let newPerms: Permission[]

        if (checked) {
            const p = permissions.find(x => x.id === permId)
            if (!p) return
            newPerms = [...currentPerms, p]
            await addRolePermission(selectedRole.id, permId)
        } else {
            newPerms = currentPerms.filter(p => p.id !== permId)
            await removeRolePermission(selectedRole.id, permId)
        }

        setSelectedRole({ ...selectedRole, permissions: newPerms })
        setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, permissions: newPerms } : r))
    }

    const openManage = (role: Role) => {
        setSelectedRole(role)
        setIsManageOpen(true)
    }

    // Helper to group permissions
    const getGroupedPermissions = () => {
        const groups: Record<string, Permission[]> = {
            "Room Management": [],
            "User Management": [],
            "Role Management": [],
            "Recording": [],
            "Other": []
        }

        permissions.forEach(p => {
            if (p.key.startsWith("room:")) groups["Room Management"].push(p)
            else if (p.key.startsWith("user:")) groups["User Management"].push(p)
            else if (p.key.startsWith("role:")) groups["Role Management"].push(p)
            else if (p.key.startsWith("recording:")) groups["Recording"].push(p)
            else groups["Other"].push(p)
        })

        return groups
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading permissions...</div>
    if (!canRead) return <div className="p-8 text-center text-muted-foreground">Unauthorized</div>

    const groupedPermissions = getGroupedPermissions()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
                    <p className="text-muted-foreground text-sm">Manage user roles and their access levels.</p>
                </div>
                {canCreate && (
                    <Button onClick={() => setIsCreateOpen(true)} size="sm" className="h-9 gap-2">
                        <Plus className="h-4 w-4" /> New Role
                    </Button>
                )}
            </div>

            {/* Roles Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[200px]">Role Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Description</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px] text-center">Permissions</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[150px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {roles.map((role) => (
                                <tr key={role.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{role.name}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{role.description || "-"}</td>
                                    <td className="p-4 align-middle text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            {role.permissions?.length || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex justify-end gap-2">
                                            {canUpdate && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => openManage(role)}
                                                >
                                                    <Settings className="h-3.5 w-3.5 mr-1.5" /> Manage
                                                </Button>
                                            )}
                                            {role.name !== "admin" && role.name !== "user" && canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(role.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Role Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card p-6 rounded-xl border border-border shadow-2xl w-full max-w-sm space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">Create Role</h3>
                            <p className="text-xs text-muted-foreground">Enter details for the new role.</p>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-3">
                                <Label>Name</Label>
                                <Input
                                    placeholder="e.g. Moderator"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                />
                                <Label>Description</Label>
                                <Input
                                    placeholder="Description of the role"
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Role</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Permissions Modal */}
            {isManageOpen && selectedRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card flex flex-col rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Manage Permissions
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Editing permissions for role: <span className="font-medium text-foreground">{selectedRole.name}</span>
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsManageOpen(false)}>Close</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(groupedPermissions).map(([category, perms]) => (
                                    perms.length > 0 && (
                                        <div key={category} className="space-y-3">
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                {category}
                                                <span className="text-[10px] bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{perms.length}</span>
                                            </h4>
                                            <div className="grid gap-2 bg-card border border-border rounded-lg p-1">
                                                {perms.map(perm => {
                                                    const isAssigned = selectedRole.permissions?.some(p => p.id === perm.id)
                                                    return (
                                                        <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                            <Checkbox
                                                                id={`perm-${perm.id}`}
                                                                checked={isAssigned}
                                                                onCheckedChange={(checked) => togglePermission(perm.id, checked === true)}
                                                                disabled={!canUpdate}
                                                                className="mt-0.5"
                                                            />
                                                            <div className="grid gap-1 leading-none">
                                                                <Label
                                                                    htmlFor={`perm-${perm.id}`}
                                                                    className="text-sm font-medium leading-none cursor-pointer"
                                                                >
                                                                    {perm.key}
                                                                </Label>
                                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                                    {perm.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 text-xs text-center text-muted-foreground">
                            Changes are saved automatically.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
