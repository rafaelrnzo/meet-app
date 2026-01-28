"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Plus, Trash2, Edit2, Check, X, Lock } from "lucide-react"
import {
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchPermissions,
    addPermissionToRole,
    removePermissionFromRole,
    initDefaultRoles,
    type Role,
    type Permission,
} from "@/lib/api/role-api"
import { useAuth } from "@/hooks/use-auth"

export default function AdminRolesPage() {
    const router = useRouter()
    // Assuming useAuth now supports checking for specific permissions or we rely on backend failure
    const { isAuthenticated, user, loading } = useAuth({ requireAdmin: true })

    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [fetching, setFetching] = useState(false)

    // Create State
    const [newRoleName, setNewRoleName] = useState("")
    const [newRoleDesc, setNewRoleDesc] = useState("")

    // UI State
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)

    useEffect(() => {
        if (isAuthenticated) {
            loadData()
        }
    }, [isAuthenticated])

    const loadData = async () => {
        setFetching(true)
        try {
            const [rolesData, permsData] = await Promise.all([
                fetchRoles(),
                fetchPermissions()
            ])
            setRoles(rolesData)
            setPermissions(permsData)
        } catch (error) {
            console.error("Failed to load roles", error)
        } finally {
            setFetching(false)
        }
    }

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newRoleName) return
        try {
            const created = await createRole(newRoleName, newRoleDesc)
            setRoles([...roles, created])
            setNewRoleName("")
            setNewRoleDesc("")
        } catch (error) {
            console.error(error)
            alert("Failed to create role")
        }
    }

    const handleDeleteRole = async (id: number) => {
        if (!confirm("Are you sure you want to delete this role?")) return
        try {
            await deleteRole(id)
            setRoles(roles.filter(r => r.id !== id))
            if (selectedRole?.id === id) setSelectedRole(null)
        } catch (error) {
            console.error(error)
            alert("Failed to delete role")
        }
    }

    const handleTogglePermission = async (role: Role, perm: Permission) => {
        const hasPerm = role.permissions.some(p => p.id === perm.id)
        try {
            if (hasPerm) {
                await removePermissionFromRole(role.id, perm.id)
            } else {
                await addPermissionToRole(role.id, perm.id)
            }
            // Reload roles to refresh permissions
            const updatedRoles = await fetchRoles()
            setRoles(updatedRoles)
            // Update selected role if it's the one being modified
            if (selectedRole?.id === role.id) {
                const updated = updatedRoles.find(r => r.id === role.id)
                if (updated) setSelectedRole(updated)
            }
        } catch (error) {
            console.error(error)
            alert("Failed to update permission")
        }
    }

    const handleInitDefaults = async () => {
        try {
            await initDefaultRoles()
            loadData()
        } catch (err) {
            alert("Failed to init defaults")
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            Role Management
                        </h1>
                        <p className="text-muted-foreground">Define roles and assign fine-grained permissions.</p>
                    </div>
                    <Button variant="outline" onClick={handleInitDefaults}>
                        Reset / Init Defaults
                    </Button>
                </div>

                {/* Roles Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left: Role List & Create */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-lg p-4">
                            <h2 className="font-semibold mb-4">Create New Role</h2>
                            <form onSubmit={handleCreateRole} className="space-y-3">
                                <Input
                                    placeholder="Role Name (e.g. moderator)"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                />
                                <Input
                                    placeholder="Description"
                                    value={newRoleDesc}
                                    onChange={e => setNewRoleDesc(e.target.value)}
                                />
                                <Button type="submit" className="w-full">Create Role</Button>
                            </form>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4">
                            <h2 className="font-semibold mb-4">Roles</h2>
                            <div className="space-y-2">
                                {roles.map(role => (
                                    <div
                                        key={role.id}
                                        className={`p-3 rounded-md border cursor-pointer flex justify-between items-center transition-colors ${selectedRole?.id === role.id
                                            ? "bg-primary/10 border-primary"
                                            : "bg-background border-border hover:bg-accent"
                                            }`}
                                        onClick={() => setSelectedRole(role)}
                                    >
                                        <div>
                                            <div className="font-medium capitalize">{role.name}</div>
                                            <div className="text-xs text-muted-foreground">{role.description}</div>
                                            <div className="text-xs text-primary mt-1">{role.permissions.length} PERMISSIONS</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteRole(role.id)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Permissions Editor */}
                    <div className="md:col-span-2">
                        {selectedRole ? (
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold capitalize">{selectedRole.name} Permissions</h2>
                                        <p className="text-muted-foreground text-sm">Toggle permissions for this role.</p>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-xs border border-border bg-secondary text-secondary-foreground">{selectedRole.permissions.length} Active</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {permissions.map(perm => {
                                        const isActive = selectedRole.permissions.some(p => p.id === perm.id)
                                        return (
                                            <div
                                                key={perm.id}
                                                onClick={() => handleTogglePermission(selectedRole, perm)}
                                                className={`
                                            p-3 rounded-md border cursor-pointer flex items-start gap-3 transition-all
                                            ${isActive
                                                        ? "bg-primary/10 border-primary"
                                                        : "bg-background border-border hover:border-primary/50"
                                                    }
                                        `}
                                            >
                                                <div className={`
                                            mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                                            ${isActive ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}
                                        `}>
                                                    {isActive && <Check className="h-3 w-3" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{perm.key}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-2" title={perm.description}>
                                                        {perm.description || "No description"}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-12">
                                <Shield className="h-12 w-12 mb-4 opacity-20" />
                                <p>Select a role to manage permissions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
