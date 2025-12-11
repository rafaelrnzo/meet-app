"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
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
  PlayCircle,
  Link2,
  Pencil,
  LayoutGrid,
  Copy,
  Calendar,
  Briefcase,
  X,
  Moon,
  Sun,
} from "lucide-react"
import {
  createDbRoom,
  deleteDbRoom,
  updateDbRoom,
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
  fetchGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  type Group as GroupDto,
  fetchUserDbRooms,
} from "@/lib/api/admin-api"
import { cn } from "@/lib/utils"
import { useAuth } from "../hooks/use-auth"

// --- THEME CONTEXT ---
type Theme = "dark" | "light"
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      document.documentElement.classList.add("dark")
      setTheme("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("app-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}

// --- MAIN PAGE COMPONENT ---

type StoredUser = { username?: string; role?: string }
type ActiveTab = "home" | "rooms" | "groups" | "users" | "recordings" | "settings"

const sidebarItems = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "rooms" as const, icon: Video, label: "Rooms" },
  { id: "groups" as const, icon: Briefcase, label: "Groups" },
  { id: "users" as const, icon: Users, label: "Users" },
  { id: "recordings" as const, icon: PlayCircle, label: "Recordings" },
  { id: "settings" as const, icon: Settings, label: "Settings" },
]

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { loading, isAuthenticated, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [active, setActive] = useState<ActiveTab>("home")
  const [roomCodeInput, setRoomCodeInput] = useState("")

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const username = user?.username || "Unknown"
  const role = user?.role || (isAdmin ? "admin" : "user")

  const handleJoin = (code?: string) => {
    const targetCode = typeof code === "string" ? code : roomCodeInput
    if (!targetCode.trim()) return
    router.push(`/meeting/${encodeURIComponent(targetCode)}`)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-200">
      {/* SIDEBAR */}
      <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-6 fixed h-full z-20 shadow-sm">
        {/* Logo */}
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm mb-8">
          V
        </div>

        <div className="flex-1 flex flex-col items-center gap-3 w-full px-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            const disabled = !isAdmin && ["rooms", "groups", "users", "recordings"].includes(item.id)

            return (
              <button
                key={item.id}
                disabled={disabled}
                onClick={() => setActive(item.id)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-all duration-200 group relative",
                  disabled && "opacity-30 cursor-not-allowed",
                  !disabled && !isActive && "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary"
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 mb-2">
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-all"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            onClick={logout}
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col ml-16 min-w-0">
        <header className="h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2 py-0.5 bg-muted border border-border rounded uppercase text-muted-foreground">
                {role}
              </span>
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-background">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {active === "home" && (
              <HomeSection
                roomCodeInput={roomCodeInput}
                setRoomCodeInput={setRoomCodeInput}
                onJoin={handleJoin}
                isAdmin={isAdmin}
              />
            )}
            {active === "rooms" && <RoomsSection isAdmin={isAdmin} />}
            {active === "groups" && <GroupsSection isAdmin={isAdmin} />}
            {active === "users" && <UsersSection isAdmin={isAdmin} />}
            {active === "recordings" && <RecordingsSection isAdmin={isAdmin} />}
            {active === "settings" && <SettingsSection />}
          </div>
        </div>
      </main>
    </div>
  )
}

/* --- HOME SECTION --- */

function HomeSection({ roomCodeInput, setRoomCodeInput, onJoin, isAdmin }: any) {
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
  const [dbUserRooms, setUserDbRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!isAdmin) {
        const [dbData, liveData] = await Promise.allSettled([fetchUserDbRooms(), fetchActiveRooms()])
        if (dbData.status === "fulfilled") setUserDbRooms(dbData.value || [])
        if (liveData.status === "fulfilled") setActiveRooms(liveData.value || [])
      } else {
        const [dbData, liveData] = await Promise.allSettled([fetchDbRooms(), fetchActiveRooms()])
        if (dbData.status === "fulfilled") setDbRooms(dbData.value || [])
        if (liveData.status === "fulfilled") setActiveRooms(liveData.value || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const displayedRooms = (isAdmin ? dbRooms : dbUserRooms).map((room) => ({
    ...room,
    isLive: !!activeRooms.find((ar) => ar.name === room.room_code),
    currentParticipants: activeRooms.find((ar) => ar.name === room.room_code)?.num_participants || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Quick Join */}
      <div className="bg-card rounded-lg border border-border p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-base font-semibold">Quick Join</h2>
          <p className="text-xs text-muted-foreground mt-1">Join an existing meeting instantly with a code.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            className="h-9 font-mono text-sm"
            placeholder="Enter room code..."
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <Button onClick={() => onJoin()} className="h-9">
            Join
          </Button>
        </div>
      </div>

      {/* Available Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Available Rooms
          </h3>
          <Button variant="outline" size="sm" onClick={loadData} className="h-8 text-xs">
            <RefreshCcw className="h-3 w-3 mr-2" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading rooms...</div>
        ) : displayedRooms.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">No rooms available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRooms.map((room) => {
              const now = new Date()
              const start = new Date(room.start_date)
              const end = new Date(room.end_date)
              const status = now < start ? "upcoming" : now > end ? "ended" : "open"
              const isFull = room.currentParticipants >= room.max_participants

              return (
                <div
                  key={room.id}
                  className="group bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all relative"
                >
                  {room.isLive && (
                    <span
                      className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-500 animate-pulse"
                      title="Live"
                    />
                  )}

                  <div className="mb-3">
                    <h4 className="text-sm font-semibold truncate pr-6">{room.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {room.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between bg-muted rounded px-3 py-2 border border-border mb-3">
                    <code className="text-xs font-mono text-primary font-medium">{room.room_code}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(room.room_code)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {start.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" /> {room.currentParticipants}/{room.max_participants}
                    </div>
                  </div>

                  <Button
                    className={cn(
                      "w-full h-8 text-xs font-medium",
                      status === "open" && !isFull
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                    )}
                    disabled={status !== "open" || isFull}
                    onClick={() => onJoin(room.room_code)}
                  >
                    {status === "ended"
                      ? "Ended"
                      : status === "upcoming"
                      ? "Scheduled"
                      : isFull
                      ? "Full"
                      : "Enter Room"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* --- ROOMS SECTION (ADMIN) --- */

function RoomsSection({ isAdmin }: { isAdmin: boolean }) {
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<DbRoom | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxParticipants: 20,
    assignedToInput: "",
    startDate: "",
    endDate: "",
    groupId: "",
  })

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const loadData = async () => {
    const [r, g] = await Promise.all([fetchDbRooms(), fetchGroups()])
    setRooms(r || [])
    setGroups(g || [])
  }

  const formatDateForInput = (iso?: string) =>
    iso
      ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : ""

  const openModal = (room?: DbRoom) => {
    setEditingRoom(room || null)
    setFormData(
      room
        ? {
            name: room.name,
            description: room.description,
            maxParticipants: room.max_participants,
            assignedToInput: room.assigned_to?.join(", ") || "",
            startDate: formatDateForInput(room.start_date),
            endDate: formatDateForInput(room.end_date),
            groupId: room.group_id ? String(room.group_id) : "",
          }
        : {
            name: "",
            description: "",
            maxParticipants: 20,
            assignedToInput: "",
            startDate: "",
            endDate: "",
            groupId: "",
          }
    )
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.startDate || !formData.endDate) return

    const payload = {
      name: formData.name,
      description: formData.description,
      maxParticipants: formData.maxParticipants,
      assignedTo: formData.assignedToInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      groupId: formData.groupId,
      startDate: formData.startDate,
      endDate: formData.endDate,
    }

    if (editingRoom) {
      await updateDbRoom(editingRoom.id, payload)
    } else {
      await createDbRoom(payload)
    }
    setIsOpen(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (confirm("Delete this room?")) {
      await deleteDbRoom(id)
      loadData()
    }
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Rooms</h2>
        <Button onClick={() => openModal()} size="sm" className="h-8">
          <Plus className="h-3 w-3 mr-1.5" /> New Room
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg shadow-2xl w-full max-w-xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">{editingRoom ? "Update Room" : "Create Room"}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    className="h-9"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Input
                    className="h-9"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                {/* Assigned To input */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Assigned To (usernames, comma separated, optional)
                  </label>
                  <Input
                    className="h-9"
                    placeholder="contoh: rafael, budi, siti"
                    value={formData.assignedToInput}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedToInput: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <Input
                    type="datetime-local"
                    className="h-9"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <Input
                    type="datetime-local"
                    className="h-9"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Group</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  >
                    <option value="">Public / Individual</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Max Participants</label>
                  <Input
                    type="number"
                    className="h-9"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({ ...formData, maxParticipants: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Save
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
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Schedule</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  No rooms found
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{room.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {room.room_code}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {room.group ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
                        GROUP: {room.group.name}
                      </span>
                    ) : room.assigned_to?.length ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                        PRIVATE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        PUBLIC
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    <div>{new Date(room.start_date).toLocaleString()}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(room)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(room.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* --- GROUPS SECTION (ADMIN) --- */

function GroupsSection({ isAdmin }: { isAdmin: boolean }) {
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [manageGroupId, setManageGroupId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState("")

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

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

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Groups</h2>
        <Button onClick={() => setIsOpen(true)} size="sm" className="h-8">
          <Plus className="h-3 w-3 mr-1.5" /> New Group
        </Button>
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
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!selectedUserId || manageGroupId !== g.id}
                  className="h-7 w-7 p-0"
                  variant="outline"
                >
                  <Plus className="h-3 w-3" />
                </Button>
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

/* --- USERS SECTION (ADMIN) --- */

function UsersSection({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<UserDto[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ username: "", password: "", role: "user" })

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  const loadData = async () => {
    const d = await fetchUsers()
    setUsers(d || [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUser(formData)
    setIsOpen(false)
    setFormData({ username: "", password: "", role: "user" })
    loadData()
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Users</h2>
        <Button onClick={() => setIsOpen(true)} size="sm" className="h-8">
          <Plus className="h-3 w-3 mr-1.5" /> New User
        </Button>
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
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
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
                    value={u.role}
                    onChange={async (e) => {
                      await updateUserRole(u.id, e.target.value)
                      loadData()
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm("Delete?")) {
                        await deleteUser(u.id)
                        loadData()
                      }
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* --- RECORDINGS SECTION (ADMIN) --- */

function RecordingsSection({ isAdmin }: { isAdmin: boolean }) {
  const [recordings, setRecordings] = useState<RecordingDto[]>([])
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [val, setVal] = useState("")

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  const load = async () => setRecordings((await fetchRecordings()) || [])

  const handleRename = async (id: number) => {
    if (val) {
      await updateRecordingName(id, val)
      setRenamingId(null)
      load()
    }
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold">Recordings</h2>
        <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs">
          <RefreshCcw className="h-3 w-3 mr-2" /> Refresh
        </Button>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {recordings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No recordings found</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted border-b border-border text-xs uppercase text-muted-foreground font-medium">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {recordings.map((r) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3">
                    {renamingId === r.id ? (
                      <div className="flex gap-2">
                        <Input
                          className="h-7 text-xs"
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" className="h-7" onClick={() => handleRename(r.id)}>
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 font-medium">
                        {r.name}
                        <button
                          onClick={() => {
                            setRenamingId(r.id)
                            setVal(r.name)
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <a
                        href={r.link}
                        target="_blank"
                        className="p-1.5 text-primary hover:bg-primary/10 rounded"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm("Delete?")) {
                            await deleteRecording(r.id)
                            load()
                          }
                        }}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* --- SETTINGS SECTION --- */

function SettingsSection() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-1">General Settings</h2>
        <p className="text-xs text-muted-foreground mb-6">Manage your application preferences.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
            <span className="text-sm font-medium">Email Notifications</span>
            <div className="h-5 w-9 bg-muted rounded-full relative cursor-not-allowed">
              <div className="h-3 w-3 bg-background rounded-full absolute top-1 left-1 shadow-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
            <span className="text-sm font-medium">Two-Factor Auth</span>
            <span className="text-xs text-muted-foreground">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
