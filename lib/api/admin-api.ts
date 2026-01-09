const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:8080"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("vc_token")
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<T>
}

export type DbRoom = {
  id: number
  name: string
  room_code: string
  description: string
  max_participants: number
  assigned_to: string[]
  start_date: string
  end_date: string
  group_id?: number
  group?: { id: number; name: string }
  created_at?: string
  updated_at?: string
}

export async function fetchDbRooms(): Promise<DbRoom[]> {
  return apiRequest<DbRoom[]>("/admin/rooms", {
    method: "GET",
    cache: "no-store",
  })
}

export async function fetchUserDbRooms(): Promise<DbRoom[]> {
  return apiRequest<DbRoom[]>("/api/rooms", {
    method: "GET",
    cache: "no-store",
  })
}

export async function createDbRoom(payload: any): Promise<DbRoom> {
  return apiRequest<DbRoom>("/admin/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      max_participants: Number(payload.maxParticipants),
      assigned_to: payload.assignedTo || [],
      group_id: payload.groupId ? Number(payload.groupId) : 0,
      start_date: new Date(payload.startDate).toISOString(),
      end_date: new Date(payload.endDate).toISOString(),
    }),
  })
}

export async function updateDbRoom(id: number, payload: any): Promise<DbRoom> {
  return apiRequest<DbRoom>(`/admin/rooms/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      max_participants: Number(payload.maxParticipants),
      assigned_to: payload.assignedTo || [],
      group_id: payload.groupId ? Number(payload.groupId) : 0,
      start_date: new Date(payload.startDate).toISOString(),
      end_date: new Date(payload.endDate).toISOString(),
    }),
  })
}

export async function deleteDbRoom(id: number): Promise<void> {
  await apiRequest(`/admin/rooms/${id}`, {
    method: "DELETE",
  })
}

export type Group = {
  id: number
  name: string
  description: string
  members?: { id: number; username: string }[]
  created_at?: string
}

export async function fetchGroups(): Promise<Group[]> {
  return apiRequest<Group[]>("/admin/groups", {
    method: "GET",
    cache: "no-store",
  })
}

export async function createGroup(payload: { name: string; description: string }): Promise<Group> {
  return apiRequest<Group>("/admin/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function deleteGroup(id: number): Promise<void> {
  await apiRequest(`/admin/groups/${id}`, {
    method: "DELETE",
  })
}

export async function addGroupMember(groupId: number, userId: number): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function removeGroupMember(groupId: number, userId: number): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  })
}

export type ActiveRoom = {
  sid: string
  name: string
  num_participants: number
  creation_time: number
}

export async function fetchActiveRooms(): Promise<ActiveRoom[]> {
  return apiRequest<ActiveRoom[]>("/admin/livekit/rooms", {
    method: "GET",
    cache: "no-store",
  })
}

export async function closeActiveRoom(name: string): Promise<void> {
  await apiRequest(`/admin/livekit/rooms/${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
}

export type User = {
  id: number
  username: string
  role: string
}

export async function fetchUsers(): Promise<User[]> {
  return apiRequest<User[]>("/admin/users", {
    method: "GET",
    cache: "no-store",
  })
}

export async function createUser(payload: {
  username: string
  password: string
  role: string
}): Promise<User> {
  return apiRequest<User>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateUserRole(id: number, role: string): Promise<User> {
  return apiRequest<User>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/admin/users/${id}`, {
    method: "DELETE",
  })
}

export type Recording = {
  id: number
  room_id: string
  name: string
  link: string
  egress_id: string
  created_at: string
}

export async function fetchRecordings(roomID?: string): Promise<Recording[]> {
  const path = roomID
    ? `/admin/recordings?room_id=${encodeURIComponent(roomID)}`
    : "/admin/recordings"

  return apiRequest<Recording[]>(path, {
    method: "GET",
    cache: "no-store",
  })
}

export async function syncRecordings(): Promise<void> {
  await apiRequest<void>("/admin/recordings/sync", {
    method: "POST",
  })
}

export async function updateRecordingName(id: number, newName: string): Promise<Recording> {
  return apiRequest<Recording>(`/admin/recordings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name: newName }),
  })
}

export async function deleteRecording(id: number): Promise<void> {
  await apiRequest<void>(`/admin/recordings/${id}`, {
    method: "DELETE",
  })
}
