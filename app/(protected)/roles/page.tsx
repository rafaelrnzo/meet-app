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
            // Find full perm object
            const p = permissions.find(x => x.id === permId)
            if (!p) return
            newPerms = [...currentPerms, p]
            await addRolePermission(selectedRole.id, permId)
        } else {
            newPerms = currentPerms.filter(p => p.id !== permId)
            await removeRolePermission(selectedRole.id, permId)
        }

        // Update local state for the modal
        setSelectedRole({ ...selectedRole, permissions: newPerms })

        // Update main list
        setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, permissions: newPerms } : r))
    }

    const openManage = (role: Role) => {
        setSelectedRole(role)
        setIsManageOpen(true)
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading permissions...</div>
    }

    if (!canRead) {
        console.log("Unauthorized access attempt. User:", user)
        console.log("Required: role:read. Has it?", hasPermission("role:read"))
        return <div className="p-8 text-center text-muted-foreground">Unauthorized</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold">Roles & Permissions</h2>
                {canCreate && (
                    <Button onClick={() => setIsCreateOpen(true)} size="sm" className="h-8">
                        <Plus className="h-3 w-3 mr-1.5" /> New Role
                    </Button>
                )}
            </div>

            {/* Create Role Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card p-5 rounded-lg border border-border shadow-xl w-full max-w-sm">
                        <h3 className="font-semibold text-sm mb-4">Create Role</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input
                                className="h-9"
                                placeholder="Role Name (e.g. Moderator)"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                            <Input
                                className="h-9"
                                placeholder="Description"
                                value={createForm.description}
                                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCreateOpen(false)}
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

            {/* Manage Permissions Modal */}
            {isManageOpen && selectedRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card p-5 rounded-lg border border-border shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold text-base">Manage Permissions</h3>
                                <p className="text-xs text-muted-foreground">Role: <span className="font-medium text-foreground">{selectedRole.name}</span></p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsManageOpen(false)}>Close</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {permissions.map(perm => {
                                    const isAssigned = selectedRole.permissions?.some(p => p.id === perm.id)
                                    return (
                                        <div key={perm.id} className="flex items-start space-x-2 p-2 rounded-md border border-border/50 hover:bg-muted/30">
                                            <Checkbox
                                                id={`perm-${perm.id}`}
                                                checked={isAssigned}
                                                onCheckedChange={(checked) => togglePermission(perm.id, checked === true)}
                                                disabled={!canUpdate}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor={`perm-${perm.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {perm.key}
                                                </Label>
                                                <p className="text-[0.8rem] text-muted-foreground">
                                                    {perm.description}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                    <div key={role.id} className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold">{role.name}</h3>
                                {role.name !== "admin" && role.name !== "user" && canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(role.id)}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{role.description || "No description"}</p>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs">
                            <div className="text-muted-foreground">
                                Permissions: <span className="text-foreground font-medium">{role.permissions?.length || 0}</span>
                            </div>
                            {canUpdate && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => openManage(role)}
                                >
                                    <Settings className="h-3 w-3 mr-1.5" /> Manage
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
