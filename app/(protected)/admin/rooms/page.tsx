"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Plus, RefreshCcw, Trash2 } from "lucide-react"
import {
  createDbRoom,
  deleteDbRoom,
  fetchDbRooms,
  type DbRoom,
} from "@/lib/api/admin-api"
import { useAuth } from "@/hooks/use-auth"

export default function AdminRoomsPage() {
  const router = useRouter()
  const { loading, isAuthenticated, isAdmin } = useAuth({ requireAdmin: true })

  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [maxParticipants, setMaxParticipants] = useState<number>(10)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return
    loadRooms()
  }, [isAuthenticated, isAdmin])

  const loadRooms = async () => {
    setError(null)
    setFetching(true)
    try {
      const data = await fetchDbRooms()
      setRooms(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch rooms")
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
        maxParticipants: maxParticipants || 10,
      })
      setName("")
      loadRooms()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to create room")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (roomId: number, roomName: string) => {
    if (!confirm(`Delete room "${roomName}" ?`)) return
    try {
      await deleteDbRoom(roomId)
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete room")
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Room Management
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage LiveKit rooms: create, list, and delete rooms.
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
              className="bg-background"
            />
            <Input
              type="number"
              min={1}
              max={100}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full sm:w-32 bg-background"
              placeholder="Max"
            />
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create room"}
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground">
            Rooms are created on the LiveKit server. If a room already exists
            with the same name, behavior follows LiveKit&apos;s config.
          </p>
        </div>

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
                    <th className="text-left px-2 py-1">Name</th>
                    <th className="text-left px-2 py-1">Participants</th>
                    <th className="text-left px-2 py-1">Max</th>
                    <th className="text-left px-2 py-1">Created</th>
                    <th className="text-right px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="rounded-xl bg-background/40"
                    >
                      <td className="px-2 py-2 font-medium">
                        {room.name}
                      </td>
                      <td className="px-2 py-2">
                        -
                      </td>
                      <td className="px-2 py-2">
                        {room.max_participants ?? "-"}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {room.created_at
                          ? new Date(room.created_at).toLocaleString()
                          : "-"}
                      </td>
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
    </div>
  )
}
