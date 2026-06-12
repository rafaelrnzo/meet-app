import type { RoomPayload, SortRoomType, StatusOption } from '@/feat/rooms/dto'
import Cookies from 'js-cookie'

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
  createdAt?: string
  updated_at?: string
  banned_users?: string[]
  presentation_path?: string
  createdById?: number
  password?: string
  is_mute_on_start: boolean
}

export type MemberRoom = {
  id: string | number
  username: string
  role: {
    id: number
    name: string
  }
  global_presence: 'waiting' | 'banned'[]
  room_presence: 'waiting' | 'banned'
}

export type RoomParams = {
  search?: string
  sort?: SortRoomType
}

export async function fetchDbRooms(searchParams?: RoomParams): Promise<DbRoom[]> {
  const { search = '', sort = 'newest' } = searchParams ?? {}
  return apiRequest<DbRoom[]>(
    '/admin/rooms',
    {
      method: 'GET',
      cache: 'no-store',
    },
    { search, sort }
  )
}

export async function fetchUserDbRooms(searchParams?: RoomParams): Promise<DbRoom[]> {
  const { search = '', sort = 'newest' } = searchParams ?? {}
  return apiRequest<DbRoom[]>(
    '/api/rooms',
    {
      method: 'GET',
      cache: 'no-store',
    },
    { search, sort }
  )
}

export async function fetchRoomByCode(code: string): Promise<DbRoom> {
  return apiRequest<DbRoom>(`/api/rooms/${code}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function createDbRoom(payload: RoomPayload): Promise<DbRoom> {
  return apiRequest<DbRoom>('/admin/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchMemberRoom({
  roomId,
  searchParams,
}: {
  roomId: number
  searchParams?: RoomParams & { status?: StatusOption }
}): Promise<MemberRoom[]> {
  return apiRequest<MemberRoom[]>(
    `/admin/rooms/${roomId}/members`,
    {
      method: 'GET',
      cache: 'no-store',
    },
    { ...searchParams }
  )
}

export async function updateDbRoom(id: number, payload: RoomPayload): Promise<DbRoom> {
  return apiRequest<DbRoom>(`/admin/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteDbRoom(id: number): Promise<void> {
  await apiRequest(`/admin/rooms/${id}`, {
    method: 'DELETE',
  })
}

export async function generateCode(roomId: number): Promise<{ code: string }> {
  const res = await apiRequest<{ code: string }>(
    `/admin/rooms/${roomId}/regenerate-code?length=10`,
    {
      method: 'POST',
      cache: 'no-store',
    }
  )
  return res
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

export async function getOnePresentation(roomId: number) {
  try {
    return await apiRequest(`/admin/presentations/${roomId}`, {
      method: 'GET',
      cache: 'no-store',
    })
  } catch {
    return []
  }
}

export async function deleteRoomPresentation(roomId: number) {
  await apiRequest(`/admin/rooms/${roomId}/presentation`, {
    method: 'DELETE',
  })
}

export type Group = {
  id: number
  name: string
  description: string
  members?: { id: number; username: string }[]
  created_at?: string
  is_editable: boolean
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

export async function addGroupMember(groupId: number, userId: number[]): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userId }),
  })
}

export async function removeGroupMember(groupId: number, payload: number[]): Promise<void> {
  await apiRequest(`/admin/groups/${groupId}/members`, {
    method: 'DELETE',
    body: JSON.stringify({ user_ids: payload }),
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

export async function fetchActiveRoomsForAll(): Promise<DbRoom[]> {
  return apiRequest<DbRoom[]>('/api/rooms', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function closeActiveRoom(name: string): Promise<void> {
  await apiRequest(`/admin/rooms/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
}

export type Permission = {
  ID: number
  key: string
  description: string
  label?: string
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

export async function addRolePermission(roleId: number, permId: number[]): Promise<void> {
  await apiRequest(`/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permission_id: permId }),
  })
}

export type User = {
  id: number
  username: string
  role?: Role
  role_id: number
  status?: 'active' | 'inactive'
}

export type UserResponse = {
  data: User[]
}

export type ParamsUserAssignment = {
  exclude_group_id?: number
  search?: string
}

export async function fetchUsers(): Promise<UserResponse> {
  return apiRequest<UserResponse>('/admin/users', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function fetchUsersAssignment(
  params?: ParamsUserAssignment,
  signal?: AbortSignal
): Promise<User[]> {
  return apiRequest<User[]>(
    '/admin/users/assignment',
    {
      signal,
      method: 'GET',
      cache: 'no-store',
    },
    { ...params }
  )
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
  name: string
  link: string
  egress_id: string
  status: string
  created_at: string
}

export async function fetchRecordings(roomID?: string): Promise<Recording[]> {
  const path = roomID
    ? `/admin/recordings?room_id=${encodeURIComponent(roomID)}`
    : '/admin/recordings'

  return apiRequest<Recording[]>(path, {
    method: 'GET',
    cache: 'no-store',
  })
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
