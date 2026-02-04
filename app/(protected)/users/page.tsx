"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Search, UserPlus, Shield, UserCog, MoreHorizontal } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function UsersPage() {
    const { hasPermission } = useAuth({ requirePermission: "user:read" })
    const [users, setUsers] = useState<UserDto[]>([])
    const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([])
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({ username: "", password: "", role_id: 0 })
    const [searchQuery, setSearchQuery] = useState("")

    const canCreate = hasPermission("user:create")
    const canUpdate = hasPermission("user:update")
    const canDelete = hasPermission("user:delete")

    useEffect(() => {
        loadData()
        loadRoles()
    }, [])

    useEffect(() => {
        if (!searchQuery) {
            setFilteredUsers(users)
        } else {
            const lower = searchQuery.toLowerCase()
            setFilteredUsers(users.filter(u => u.username.toLowerCase().includes(lower)))
        }
    }, [users, searchQuery])

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

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault()
        await createUser(formData)
        setIsOpen(false)
        setFormData({ username: "", password: "", role_id: roles[0]?.id || 0 })
        loadData()
    }

    const getRoleName = (user: UserDto) => {
        if (user.role) return user.role.name
        const r = roles.find(r => r.id === user.role_id)
        return r ? r.name : "Unknown"
    }

    const getRoleBadgeVariant = (roleName: string) => {
        const lower = roleName.toLowerCase()
        if (lower === "admin" || lower === "administrator") return "destructive" // Red/Orange
        if (lower === "manager" || lower === "moderator") return "default" // Primary
        return "secondary" // Gray
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage user access and permissions.
                    </p>
                </div>
                {canCreate && (
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                <Plus className="h-4 w-4 mr-2" /> Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the system. They will receive default permissions based on the role.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Username</label>
                                    <Input
                                        placeholder="e.g. john_doe"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Select
                                        value={formData.role_id.toString()}
                                        onValueChange={(val) => setFormData({ ...formData, role_id: Number(val) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={r.id.toString()}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={() => handleCreate()}>
                                    Create Account
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 bg-card/50 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground ml-2" />
                <Input
                    placeholder="Search users..."
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users Table */}
            <Card className="border-border shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((u) => (
                                <TableRow key={u.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{u.username}</p>
                                                <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {canUpdate ? (
                                                <div className="w-[180px]">
                                                    <Select
                                                        value={(u.role_id || u.role?.id)?.toString()}
                                                        onValueChange={async (val) => {
                                                            try {
                                                                await updateUserRole(u.id, Number(val))
                                                                loadData()
                                                            } catch (e) {
                                                                console.error(e)
                                                            }
                                                        }}
                                                        disabled={!canUpdate}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={getRoleBadgeVariant(getRoleName(u))} className="px-1.5 py-0 text-[10px] uppercase h-5 pointer-events-none">
                                                                    {getRoleName(u)}
                                                                </Badge>
                                                                {/* Helper text for context in dropdown, hidden in trigger if redundant */}
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.map((r) => (
                                                                <SelectItem key={r.id} value={r.id.toString()}>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant={getRoleBadgeVariant(r.name)} className="scale-75 origin-left">
                                                                            {r.name}
                                                                        </Badge>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <Badge variant={getRoleBadgeVariant(getRoleName(u))}>
                                                    {getRoleName(u)}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (confirm(`Are you sure you want to delete ${u.username}?`)) {
                                                        await deleteUser(u.id)
                                                        loadData()
                                                    }
                                                }}
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
