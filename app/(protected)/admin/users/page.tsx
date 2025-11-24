"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, RefreshCcw, Trash2, Shield } from "lucide-react"
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUserRole,
  type User,
} from "@/lib/admin-api"
import { useAuth } from "@/app/hooks/use-auth"

export default function AdminUsersPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isAdmin } = useAuth({ requireAdmin: true })

  const [users, setUsers] = useState<User[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [creating, setCreating] = useState(false)

  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin])

  const loadUsers = async () => {
    setError(null)
    setFetching(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch users")
    } finally {
      setFetching(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) return
    setCreating(true)
    setError(null)
    try {
      const user = await createUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      })
      setUsers((prev) => [...prev, user])
      setNewUsername("")
      setNewPassword("")
      setNewRole("user")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to create user")
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (id: number, role: string) => {
    setUpdatingId(id)
    try {
      const updated = await updateUserRole(id, role)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u))
      )
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update role")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Delete user "${username}" ?`)) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete user")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Checking admin permission...
        </p>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          You are not authorized to view this page.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage application users: create, update roles, and delete.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="text-xs"
          >
            Back to dashboard
          </Button>
        </div>

        {/* Create user form */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Create new user
          </h2>
          <form
            onSubmit={handleCreateUser}
            className="grid gap-3 md:grid-cols-4"
          >
            <Input
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-background md:col-span-1"
            />
            <Input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-background md:col-span-1"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground md:col-span-1"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              type="submit"
              disabled={creating}
              className="w-full md:col-span-1"
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground">
            Password akan disimpan sesuai logic backend kamu (sebaiknya
            di-hash). Endpoint di backend: <code>/admin/users</code>.
          </p>
        </div>

        {/* List users */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Existing users</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={loadUsers}
              disabled={fetching}
              className="h-8 w-8"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <p className="text-xs text-destructive mb-3">{error}</p>
          )}

          {fetching && users.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No users found. Create one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-separate border-spacing-y-1">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-2 py-1">ID</th>
                    <th className="text-left px-2 py-1">Username</th>
                    <th className="text-left px-2 py-1">Role</th>
                    <th className="text-right px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="rounded-xl bg-background/40"
                    >
                      <td className="px-2 py-2">{u.id}</td>
                      <td className="px-2 py-2 font-medium">
                        {u.username}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={u.role}
                          disabled={updatingId === u.id}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className="bg-background border border-input rounded-md px-2 py-1 text-xs"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-destructive border-destructive/40"
                          onClick={() => handleDelete(u.id, u.username)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
