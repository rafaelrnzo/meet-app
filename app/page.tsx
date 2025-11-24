"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Home,
  Video,
  Users,
  Settings,
  LogOut,
  Plus,
  RefreshCcw,
  Trash2,
  Shield,
} from "lucide-react"
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  type Room,
  createUser,
  deleteUser,
  fetchUsers,
  updateUserRole,
  type User as UserDto,
} from "@/lib/admin-api"
import { cn } from "@/lib/utils"
import { useAuth } from "./hooks/use-auth"

type StoredUser = {
  username?: string
  role?: string
}

type ActiveTab = "home" | "rooms" | "users" | "settings"

const sidebarItems = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "rooms" as const, icon: Video, label: "Rooms" },
  { id: "users" as const, icon: Users, label: "Users" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isAdmin, logout } = useAuth()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [active, setActive] = useState<ActiveTab>("home")
  const [roomName, setRoomName] = useState("default-room")

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const username = user?.username || "Unknown"
  const role = user?.role || (isAdmin ? "admin" : "user")

  const handleJoin = () => {
    if (!roomName.trim()) return
    router.push(`/meeting/${encodeURIComponent(roomName)}`)
  }

  const handleSidebarClick = (id: ActiveTab) => {
    if (!isAdmin && (id === "rooms" || id === "users")) return
    setActive(id)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* SIDEBAR ICON-ONLY */}
      <aside className="w-16 border-r border-sidebar-border flex flex-col items-center py-4 gap-4 bg-sidebar text-sidebar-foreground">
        <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
          M
        </div>

        <div className="flex-1 flex flex-col items-center gap-3 mt-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            const disabled =
              !isAdmin && (item.id === "rooms" || item.id === "users")

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSidebarClick(item.id)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  disabled
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && !disabled && "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={logout}
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Dashboard
            </span>
            <span className="text-sm">
              Welcome back,{" "}
              <span className="font-semibold">{username}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">
                {role === "admin" ? "Administrator" : "User"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/30">
          {active === "home" && (
            <HomeSection
              roomName={roomName}
              setRoomName={setRoomName}
              onJoin={handleJoin}
              role={role}
            />
          )}

          {active === "rooms" && (
            <RoomsSection isAdmin={isAdmin} />
          )}

          {active === "users" && (
            <UsersSection isAdmin={isAdmin} />
          )}

          {active === "settings" && (
            <SettingsSection />
          )}
        </div>
      </main>
    </div>
  )
}

/* HOME SECTION */

function HomeSection({
  roomName,
  setRoomName,
  onJoin,
  role,
}: {
  roomName: string
  setRoomName: (v: string) => void
  onJoin: () => void
  role: string
}) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Quick join */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card text-card-foreground p-5 shadow">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Quick Meeting
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan nama room untuk join / membuat meeting baru.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Input
              className="flex-1"
              placeholder="Nama room (contoh: daily-standup)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Button
              onClick={onJoin}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Join Meeting
            </Button>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Room reusable, bisa dipakai berkali-kali. LiveKit akan menggunakan nama ini
            untuk membuat atau reuse room sesuai konfigurasi server.
          </p>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status akun</p>
            <p className="text-sm font-medium">
              {role === "admin"
                ? "Anda memiliki akses admin (room & user management)"
                : "Akun user standar (join meeting)"}
            </p>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Setelah ini kamu bisa:
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Kelola room LiveKit (tab Rooms)</li>
              <li>Kelola user & role (tab Users)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ROOMS SECTION */
function RoomsSection({ isAdmin }: { isAdmin: boolean }) {
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [maxParticipants, setMaxParticipants] = useState<number>(10)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const loadRooms = async () => {
    setError(null)
    setFetching(true)
    try {
      const data = await fetchRooms()
      // ⬇️ pastikan SELALU array
      if (Array.isArray(data)) {
        setRooms(data)
      } else {
        console.warn("fetchRooms returned non-array:", data)
        setRooms([])
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch rooms")
      setRooms([]) // fallback agar tidak null
    } finally {
      setFetching(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createRoom({
        name: name.trim(),
        maxParticipants: maxParticipants || 10,
      })
      setName("")
      await loadRooms()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to create room")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (roomName: string) => {
    if (!confirm(`Delete room "${roomName}" ?`)) return
    try {
      await deleteRoom(roomName)
      setRooms((prev) =>
        Array.isArray(prev) ? prev.filter((r) => r.name !== roomName) : prev,
      )
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete room")
    }
  }

  // ⬇️ helper biar aman
  const safeRooms: Room[] = Array.isArray(rooms) ? rooms : []
  const hasRooms = safeRooms.length > 0

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card text-card-foreground p-5">
        <p className="text-sm text-muted-foreground">
          Hanya admin yang dapat mengakses Room Management.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Create room */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create new room
        </h2>
        <form
          onSubmit={handleCreateRoom}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            placeholder="Room name (e.g. daily-standup)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="number"
            min={1}
            max={50}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="w-full sm:w-32"
            placeholder="Max"
          />
          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create room"}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground">
          Backend akan membatasi maksimal peserta ke 20. Jika diisi &gt; 20, otomatis
          di-clamp menjadi 20 dan status room akan menjadi <code>max</code> bila
          jumlah peserta mencapai batas.
        </p>
      </div>

      {/* List rooms */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Existing rooms</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={loadRooms}
            disabled={fetching}
            className="h-8 w-8"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive mb-3">{error}</p>
        )}

        {fetching && !hasRooms ? (
          <p className="text-xs text-muted-foreground">Loading rooms...</p>
        ) : !hasRooms ? (
          <p className="text-xs text-muted-foreground">
            No rooms found. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-y-1">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-2 py-1">Name</th>
                  <th className="text-left px-2 py-1">Participants</th>
                  <th className="text-left px-2 py-1">Max</th>
                  <th className="text-left px-2 py-1">Status</th>
                  <th className="text-left px-2 py-1">Created</th>
                  <th className="text-right px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeRooms.map((room) => {
                  const status =
                    room.status ||
                    ((room.num_participants ?? 0) >= 20 ? "max" : "open")

                  return (
                    <tr
                      key={room.sid || room.name}
                      className="rounded-xl bg-background/40"
                    >
                      <td className="px-2 py-2 font-medium">
                        {room.name}
                      </td>
                      <td className="px-2 py-2">
                        {room.num_participants ?? 0}
                      </td>
                      <td className="px-2 py-2">
                        {room.max_participants ?? "-"}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            status === "max"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-400",
                          )}
                        >
                          {status === "max" ? "Max / Locked" : "Open"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {room.creation_time
                          ? new Date(room.creation_time * 1000).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-destructive border-destructive/40"
                          onClick={() => handleDelete(room.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* USERS SECTION */

function UsersSection({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<UserDto[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [creating, setCreating] = useState(false)

  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

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
        prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)),
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

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card text-card-foreground p-5">
        <p className="text-sm text-muted-foreground">
          Hanya admin yang dapat mengakses User Management.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Create user */}
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
            className="md:col-span-1"
          />
          <Input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="md:col-span-1"
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
          Password akan di-hash di backend sebelum disimpan ke database.
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
  )
}

/* SETTINGS SECTION */

function SettingsSection() {
  return (
    <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card text-card-foreground p-5">
      <h2 className="text-sm font-semibold mb-2">Settings</h2>
      <p className="text-xs text-muted-foreground">
        Placeholder untuk pengaturan aplikasi (theme, profile, dsb). Bisa diisi nanti.
      </p>
    </div>
  )
}
