"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/api/auth-client"
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
  PlayCircle,
  Link2,
  Pencil,
  LayoutGrid,
  CalendarClock
} from "lucide-react"
import {
  createDbRoom,
  deleteDbRoom,
  fetchDbRooms,
  fetchActiveRooms,
  type DbRoom,
  type ActiveRoom,
  createUser,
  deleteUser,
  fetchUsers,
  updateUserRole,
  type User as UserDto,
  fetchRecordings,
  updateRecordingName,
  deleteRecording,
  type Recording as RecordingDto,
} from "@/lib/api/admin-api"
import { cn } from "@/lib/utils"
import { useAuth } from "../hooks/use-auth"

type StoredUser = {
  username?: string
  role?: string
}

type ActiveTab = "home" | "rooms" | "users" | "recordings" | "settings"

const sidebarItems = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "rooms" as const, icon: Video, label: "Rooms Management" },
  { id: "users" as const, icon: Users, label: "Users" },
  { id: "recordings" as const, icon: PlayCircle, label: "Recordings" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
]

export default function DashboardPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isAdmin, logout } = useAuth()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [active, setActive] = useState<ActiveTab>("home")
  const [roomName, setRoomName] = useState("")

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

  const handleJoin = (name?: string) => {
    const targetRoom = typeof name === "string" ? name : roomName
    if (!targetRoom.trim()) return
    router.push(`/meeting/${encodeURIComponent(targetRoom)}`)
  }

  const handleSidebarClick = (id: ActiveTab) => {
    if (!isAdmin && (id === "rooms" || id === "users" || id === "recordings")) return
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
              !isAdmin && (item.id === "rooms" || item.id === "users" || item.id === "recordings")

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

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Dashboard
            </span>
            <span className="text-sm">
              Welcome back, <span className="font-semibold">{username}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
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
        <div className="flex-1 p-6 bg-gradient-to-br from-background via-background to-muted/30 overflow-y-auto">
          {active === "home" && (
            <HomeSection
              roomName={roomName}
              setRoomName={setRoomName}
              onJoin={handleJoin}
              role={role}
            />
          )}

          {active === "rooms" && <RoomsSection isAdmin={isAdmin} />}

          {active === "users" && <UsersSection isAdmin={isAdmin} />}

          {active === "recordings" && <RecordingsSection isAdmin={isAdmin} />}

          {active === "settings" && <SettingsSection />}
        </div>
      </main>
    </div>
  )
}

/* ======================
 * HOME SECTION
 * ====================== */

function HomeSection({
  roomName,
  setRoomName,
  onJoin,
  role,
}: {
  roomName: string
  setRoomName: (v: string) => void
  onJoin: (name?: string) => void
  role: string
}) {
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Ambil list room statis dari DB
      const dbData = await fetchDbRooms()
      if (Array.isArray(dbData)) {
        setDbRooms(dbData)
      }

      // 2. Ambil status aktif dari LiveKit (optional, untuk badge 'Live')
      try {
        const liveData = await fetchActiveRooms()
        if (Array.isArray(liveData)) {
          setActiveRooms(liveData)
        }
      } catch (e) {
        // Jika gagal fetch active rooms, abaikan saja
        console.warn("Failed to fetch active stats", e)
      }

    } catch (e) {
      console.error("Failed to load rooms", e)
    } finally {
      setLoading(false)
    }
  }

  // Merge Data: Room DB + Info Participants jika aktif
  const displayedRooms = dbRooms.map(room => {
    const activeInfo = activeRooms.find(ar => ar.name === room.name)
    return {
      ...room,
      isLive: !!activeInfo,
      currentParticipants: activeInfo?.num_participants || 0
    }
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 gap-4 items-stretch">
        <div className="md:col-span-2 rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Quick Join
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Masukkan nama room yang terdaftar di sistem.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Input
              className="flex-1"
              placeholder="Cari atau ketik nama room..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onJoin()}
            />
            <Button
              onClick={() => onJoin()}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Join Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60 w-full my-2" />

      {/* Available Rooms List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Available Rooms
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadData}
            className="h-8 text-xs text-muted-foreground"
          >
            <RefreshCcw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl bg-muted/20">
            <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada room yang dibuat oleh Admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayedRooms.map((room) => {
              const isMax = room.currentParticipants >= room.max_participants

              return (
                <div
                  key={room.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm truncate pr-2" title={room.name}>
                        {room.name}
                      </h4>
                      {room.isLive && (
                         <span className="flex h-2 w-2 rounded-full shrink-0 mt-1.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Live Now" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-3">
                        {room.description || "Tidak ada deskripsi."}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className={cn(
                          "flex items-center text-xs px-2 py-1 rounded-md",
                          room.isLive ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"
                      )}>
                        <Users className="h-3 w-3 mr-1.5" />
                        <span>{room.currentParticipants} / {room.max_participants}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button 
                      className="w-full h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant={room.isLive ? "default" : "secondary"}
                      disabled={isMax}
                      onClick={() => onJoin(room.name)}
                    >
                      {isMax ? "Full" : room.isLive ? "Join Now" : "Start Meeting"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================
 * ROOMS SECTION (ADMIN CRUD)
 * ====================== */

function RoomsSection({ isAdmin }: { isAdmin: boolean }) {
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxParticipants, setMaxParticipants] = useState<number>(20)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    loadRooms()
  }, [isAdmin])

  const loadRooms = async () => {
    setError(null)
    setFetching(true)
    try {
      const data = await fetchDbRooms()
      if (Array.isArray(data)) {
        setRooms(data)
      } else {
        setRooms([])
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch rooms")
      setRooms([])
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
      await createDbRoom({
        name: name.trim(),
        description: description.trim(),
        maxParticipants: maxParticipants || 20,
      })
      setName("")
      setDescription("")
      await loadRooms()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to create room")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number, roomName: string) => {
    if (!confirm(`Delete room "${roomName}" (Database)?`)) return
    try {
      await deleteDbRoom(id)
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete room")
    }
  }

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
          Create new static room
        </h2>
        <form
          onSubmit={handleCreateRoom}
          className="grid gap-3 md:grid-cols-4"
        >
          <div className="md:col-span-1">
            <Input
                placeholder="Room Name (Unique)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 md:col-span-1">
             <Input
                type="number"
                min={1}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-20"
                placeholder="Max"
            />
            <Button type="submit" disabled={creating} className="flex-1">
                {creating ? "..." : "Create"}
            </Button>
          </div>
        </form>
        <p className="text-[11px] text-muted-foreground">
          Room ini akan tersimpan di database. User hanya bisa join jika room ada di list ini.
        </p>
      </div>

      {/* List rooms */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Existing Database Rooms</h2>
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

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        {fetching && rooms.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No rooms found. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-y-1">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-2 py-1">ID</th>
                  <th className="text-left px-2 py-1">Name</th>
                  <th className="text-left px-2 py-1">Description</th>
                  <th className="text-left px-2 py-1">Max</th>
                  <th className="text-right px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="rounded-xl bg-background/40"
                  >
                    <td className="px-2 py-2 text-muted-foreground">{room.id}</td>
                    <td className="px-2 py-2 font-medium">{room.name}</td>
                    <td className="px-2 py-2 text-muted-foreground truncate max-w-[200px]">{room.description}</td>
                    <td className="px-2 py-2">{room.max_participants}</td>
                    <td className="px-2 py-2 text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-destructive border-destructive/40"
                        onClick={() => handleDelete(room.id, room.name)}
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

/* ======================
 * USERS SECTION
 * ====================== */
// ... (UserSection code remains mostly the same, included above in full block if needed, but context suggests focus on Rooms)

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

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        {fetching && users.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No users found.
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
                  <tr key={u.id} className="rounded-xl bg-background/40">
                    <td className="px-2 py-2">{u.id}</td>
                    <td className="px-2 py-2 font-medium">{u.username}</td>
                    <td className="px-2 py-2">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
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

/* ======================
 * RECORDINGS SECTION
 * ====================== */
// ... (RecordingsSection stays exactly the same as previous)

function RecordingsSection({ isAdmin }: { isAdmin: boolean }) {
  const [recordings, setRecordings] = useState<RecordingDto[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterRoomId, setFilterRoomId] = useState("")
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState("")

  useEffect(() => {
    if (!isAdmin) return
    loadRecordings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const loadRecordings = async (roomID?: string) => {
    setError(null)
    setFetching(true)
    try {
      const data = await fetchRecordings(roomID)
      setRecordings(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch recordings")
      setRecordings([])
    } finally {
      setFetching(false)
    }
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    const roomID = filterRoomId.trim() || undefined
    loadRecordings(roomID)
  }

  const handleStartRename = (rec: RecordingDto) => {
    setRenamingId(rec.id)
    setRenameValue(rec.name)
  }

  const handleSaveRename = async (rec: RecordingDto) => {
    if (!renameValue.trim()) return
    try {
      const updated = await updateRecordingName(rec.id, renameValue.trim())
      setRecordings((prev) =>
        prev.map((r) => (r.id === rec.id ? updated : r)),
      )
      setRenamingId(null)
      setRenameValue("")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update recording name")
    }
  }

  const handleDelete = async (rec: RecordingDto) => {
    if (!confirm(`Delete recording "${rec.name}" ?`)) return
    try {
      await deleteRecording(rec.id)
      setRecordings((prev) => prev.filter((r) => r.id !== rec.id))
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete recording")
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card text-card-foreground p-5">
        <p className="text-sm text-muted-foreground">
          Hanya admin yang dapat mengakses Recording Management.
        </p>
      </div>
    )
  }

  const hasRecordings = recordings.length > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Filter */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <PlayCircle className="h-4 w-4" />
          Recordings
        </h2>
        <form
          onSubmit={handleFilter}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            placeholder="Filter by Room ID (opsional)"
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
          />
          <Button type="submit" disabled={fetching}>
            {fetching ? "Loading..." : "Apply filter"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              setFilterRoomId("")
              loadRecordings()
            }}
            disabled={fetching}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* List recordings */}
      <div className="rounded-2xl border border-border bg-card text-card-foreground p-4">
        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        {fetching && !hasRecordings ? (
          <p className="text-xs text-muted-foreground">Loading recordings...</p>
        ) : !hasRecordings ? (
          <p className="text-xs text-muted-foreground">
            Belum ada recording yang tersimpan di database.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-y-1">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-2 py-1">ID</th>
                  <th className="text-left px-2 py-1">Title / Name</th>
                  <th className="text-left px-2 py-1">Room ID</th>
                  <th className="text-left px-2 py-1">Egress ID</th>
                  <th className="text-left px-2 py-1">Created</th>
                  <th className="text-right px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recordings.map((rec) => {
                  const created =
                    rec.created_at &&
                    !Number.isNaN(Date.parse(rec.created_at))
                      ? new Date(rec.created_at).toLocaleString()
                      : rec.created_at

                  const isRenaming = renamingId === rec.id

                  return (
                    <tr
                      key={rec.id}
                      className="rounded-xl bg-background/40"
                    >
                      <td className="px-2 py-2">{rec.id}</td>
                      <td className="px-2 py-2">
                        {isRenaming ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-7 text-xs"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSaveRename(rec)}
                            >
                              ✓
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => {
                                setRenamingId(null)
                                setRenameValue("")
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-medium truncate max-w-[220px]">
                              {rec.name}
                            </span>
                            <button
                              type="button"
                              className="ml-1 text-muted-foreground hover:text-foreground"
                              onClick={() => handleStartRename(rec)}
                              title="Rename"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">
                          {rec.room_id}
                        </code>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[11px] text-muted-foreground truncate max-w-[160px] inline-block">
                          {rec.egress_id}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {created || "-"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            asChild
                          >
                            <a
                              href={rec.link}
                              target="_blank"
                              rel="noreferrer"
                              title="Open recording"
                            >
                              <Link2 className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive border-destructive/40"
                            onClick={() => handleDelete(rec)}
                            title="Delete record (DB)"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

/* ======================
 * SETTINGS SECTION
 * ====================== */

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