import Cookies from 'js-cookie'
import { qstring } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || 'http://localhost:8080'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return (
      Cookies.get('token') ||
      Cookies.get('vc_token') ||
      Cookies.get('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('vc_token') ||
      localStorage.getItem('access_token')
    )
  } catch (e) {
    console.error('Failed to access storage', e)
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  searchParams = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const params = new URLSearchParams(searchParams)
  const queryString = params.toString()
  const url = queryString ? `${API_BASE}${path}?${queryString}` : `${API_BASE}${path}`
  console.log(`[API Request] ${options.method || 'GET'} ${url}`)
  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => '')
    throw new Error(data?.error || `Request failed with status ${res.status}`)
  }

  // Handle empty responses (like 204 No Content)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  console.log(`[API Response] ${url}:`, data)
  return data
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
  banned_users?: string[]
  presentation_path?: string
  createdById?: number
  password?: string
}

export async function fetchDbRooms(): Promise<DbRoom[]> {
  return apiRequest<DbRoom[]>('/admin/rooms', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function fetchUserDbRooms(): Promise<DbRoom[]> {
  return apiRequest<DbRoom[]>('/api/rooms', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function fetchRoomByCode(code: string): Promise<DbRoom> {
  return apiRequest<DbRoom>(`/api/rooms/${code}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createDbRoom(payload: any): Promise<DbRoom> {
  return apiRequest<DbRoom>('/admin/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      max_participants: Number(payload.maxParticipants),
      assigned_to: payload.assignedTo || [],
      group_id: payload.groupId ? Number(payload.groupId) : 0,
      start_date: new Date(payload.startDate).toISOString(),
      end_date: new Date(payload.endDate).toISOString(),
      password: payload.password,
    }),
  })
}

export async function updateDbRoom(id: number, payload: any): Promise<DbRoom> {
  return apiRequest<DbRoom>(`/admin/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      max_participants: Number(payload.maxParticipants),
      assigned_to: payload.assignedTo || [],
      group_id: payload.groupId ? Number(payload.groupId) : 0,
      start_date: new Date(payload.startDate).toISOString(),
      end_date: new Date(payload.endDate).toISOString(),
      password: payload.password,
    }),
  })
}

export async function deleteDbRoom(id: number): Promise<void> {
  await apiRequest(`/admin/rooms/${id}`, {
    method: 'DELETE',
  })
}

export async function uploadRoomPresentation(id: number, file: File): Promise<{ path: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}/admin/rooms/${id}/presentation`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to upload presentation')
  }

  return res.json()
}

export type Group = {
  id: number
  name: string
  description: string
  members?: { id: number; username: string }[]
  created_at?: string
}

export async function fetchGroups(): Promise<Group[]> {
  return apiRequest<Group[]>('/admin/groups', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createGroup(payload: { name: string; description: string }): Promise<Group> {
  return apiRequest<Group>('/admin/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteGroup(id: number): Promise<void> {
  await apiRequest(`/admin/groups/${id}`, {
    method: 'DELETE',
  })
}

export async function addGroupMember(groupId: number, userId: number): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function removeGroupMember(groupId: number, userId: number): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  })
}

export type ActiveRoom = {
  num_publishers: number
  sid: string
  name: string
  num_participants: number
  creation_time: number
  metadata?: string
}

export async function fetchActiveRooms(): Promise<ActiveRoom[]> {
  return apiRequest<ActiveRoom[]>('/admin/livekit/rooms', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function closeActiveRoom(name: string): Promise<void> {
  await apiRequest(`/admin/livekit/rooms/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
}

export type Permission = {
  id: number
  key: string
  description: string
}

export type Role = {
  id: number
  name: string
  description: string
  permissions?: Permission[]
}

export async function fetchRoles(): Promise<Role[]> {
  return apiRequest<Role[]>('/admin/roles', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createRole(payload: { name: string; description: string }): Promise<Role> {
  return apiRequest<Role>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateRole(
  id: number,
  payload: { name: string; description: string }
): Promise<Role> {
  return apiRequest<Role>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteRole(id: number): Promise<void> {
  await apiRequest(`/admin/roles/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchPermissions(): Promise<Permission[]> {
  return apiRequest<Permission[]>('/admin/roles/permissions', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function addRolePermission(roleId: number, permId: number): Promise<void> {
  await apiRequest(`/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permission_id: permId }),
  })
}

export async function removeRolePermission(roleId: number, permId: number): Promise<void> {
  await apiRequest(`/admin/roles/${roleId}/permissions/${permId}`, {
    method: 'DELETE',
  })
}

export type User = {
  id: number
  username: string
  role?: Role
  role_id: number
}

export async function fetchUsers(): Promise<User[]> {
  return apiRequest<User[]>('/admin/users', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createUser(payload: {
  username: string
  password: string
  role_id: number
}): Promise<User> {
  return apiRequest<User>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateUserRole(id: number, role_id: number): Promise<User> {
  return apiRequest<User>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role_id }),
  })
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/admin/users/${id}`, {
    method: 'DELETE',
  })
}

export type Recording = {
  id: number
  room_id: string
  room_name: string
  name: string
  link: string
  egress_id: string
  status: 'STARTED' | 'PROCESSING' | 'COMPLETED'
  created_at: string
}

export type RecordingParams = {
  room_id?: string
  search?: string
}

export async function fetchRecordings(
  params?: RecordingParams,
  signal?: AbortSignal
): Promise<Recording[]> {
  return apiRequest<Recording[]>(
    qstring('/admin/recordings', { ...params }, { skipEmpty: true, skipNulls: true }),
    {
      signal,
      method: 'GET',
      cache: 'no-store',
    }
  )
}

export async function syncRecordings(): Promise<void> {
  await apiRequest<void>('/admin/recordings/sync', {
    method: 'POST',
  })
}

export async function updateRecordingName(id: number, newName: string): Promise<Recording> {
  return apiRequest<Recording>(`/admin/recordings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name: newName }),
  })
}

export async function updateRecordingStatus(id: number, status: string): Promise<Recording> {
  return apiRequest<Recording>(`/admin/recordings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteRecording(id: number): Promise<void> {
  await apiRequest<void>(`/admin/recordings/${id}`, {
    method: 'DELETE',
  })
}

export async function muteAllParticipants(
  roomCode: string,
  muteAudio: boolean,
  muteVideo: boolean
): Promise<void> {
  await apiRequest<void>('/admin/livekit/rooms/mute-all', {
    method: 'POST',
    body: JSON.stringify({ room_code: roomCode, mute_audio: muteAudio, mute_video: muteVideo }),
  })
}

export async function updateRoomPermissions(roomCode: string, metadata: any): Promise<void> {
  await apiRequest<void>('/admin/livekit/rooms/permissions', {
    method: 'POST',
    body: JSON.stringify({ room_code: roomCode, metadata: JSON.stringify(metadata) }),
  })
}

export async function muteParticipant(
  roomCode: string,
  identity: string,
  muteAudio: boolean,
  muteVideo: boolean
): Promise<void> {
  await apiRequest<void>('/admin/livekit/participants/mute', {
    method: 'POST',
    body: JSON.stringify({
      room_code: roomCode,
      identity,
      mute_audio: muteAudio,
      mute_video: muteVideo,
    }),
  })
}

export async function banParticipant(roomCode: string, identity: string): Promise<void> {
  await apiRequest<void>('/api/livekit/ban', {
    method: 'POST',
    body: JSON.stringify({ room_code: roomCode, identity }),
  })
}

export async function unbanParticipant(roomCode: string, identity: string): Promise<void> {
  await apiRequest<void>('/api/livekit/unban', {
    method: 'POST',
    body: JSON.stringify({ room_code: roomCode, identity }),
  })
}
