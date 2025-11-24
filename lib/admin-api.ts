// lib/admin-api.ts
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("vc_token")
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
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

/* ---------- ROOM ---------- */

export type Room = {
  sid?: string
  name: string
  empty_timeout?: number
  max_participants?: number
  num_participants?: number
  creation_time?: number
  metadata?: string
  status?: string // "open" | "max"
}

export async function fetchRooms(): Promise<Room[]> {
  return apiRequest<Room[]>("/admin/livekit/rooms", {
    method: "GET",
    cache: "no-store",
  })
}

export async function createRoom(payload: {
  name: string
  emptyTimeout?: number
  maxParticipants?: number
  metadata?: string
}): Promise<Room> {
  return apiRequest<Room>("/admin/livekit/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      emptyTimeout: payload.emptyTimeout ?? 300,
      maxParticipants: payload.maxParticipants ?? 10,
      metadata: payload.metadata ?? "",
    }),
  })
}

export async function deleteRoom(name: string): Promise<void> {
  await apiRequest(`/admin/livekit/rooms/${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
}

/* ---------- USERS ---------- */

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
