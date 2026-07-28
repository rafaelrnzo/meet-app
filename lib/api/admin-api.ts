'use server'

import type { UserParams } from '@/feat/users/dto'
import type {
  FileResponse,
  RoomMetadata,
  RoomPayload,
  SortRoomType,
  StatusOption,
} from '@/feat/rooms/dto'
import type { PollingMessage } from '@/components/PollingCard'
import { djs, qstring } from '@/lib/utils'
import { auth } from '@/lib/auth'

const API_BASE = process.env.APP_API_VIDEO_CONFERENCE

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  searchParams = {}
): Promise<T> {
  const session = await auth()
  const token = session?.access_token

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const params = new URLSearchParams(searchParams)
  const queryString = params.toString()
  const url = queryString ? `${API_BASE}${path}?${queryString}` : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => '')
    throw new Error(data?.error || `Request failed with status ${res.status}`, {
      cause: { status: res.status },
    })
  }

  const responseType = res.headers.get('content-type')
  if (responseType === 'video/mp4') {
    const data = await res.blob()
    return data as T
  }

  // Handle empty responses (like 204 No Content)
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  return data as T
}

export interface DbRoom {
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
  max_upload_size: number
  presentation_path?: string
  createdById?: number
  password?: string
  participants?: number
  enable_start_room: boolean
  metadata: RoomMetadata
  enable_waiting_room: boolean
}

export interface MemberRoom {
  id: string | number
  username: string
  role: {
    id: number
    name: string
  }
  global_presence: 'waiting' | 'banned'[]
  room_presence: 'waiting' | 'banned'
}

export interface RoomParams {
  search?: string
  sort?: SortRoomType
}

export async function getRoomListConfig(searchParams: object) {
  const session = await auth()
  const initialRooms = await fetchUserDbRooms(searchParams)
  const isAdmin = session?.roles.name === 'admin'

  const hasPermission = (key: string) => {
    return !!session?.roles?.permissions?.some((perm) => perm.key.endsWith(key))
  }

  // Only show if room end date is AFTER today's milisecond
  const rooms = initialRooms.filter((room) => djs(room.end_date).isAfter(djs()))

  return {
    isAdmin,
    hasPermission,
    initialRooms,
    rooms,
    isEmpty: !('search' in searchParams) && !rooms.length,
    isInvalid: 'search' in searchParams && !rooms.length,
  }
}

export async function getPresentationUrl(roomId: number) {
  try {
    const { file_url } = await apiRequest<FileResponse>(`/admin/presentations/${roomId}`, {
      method: 'GET',
      cache: 'no-store',
    })

    return { data: file_url }
  } catch (e) {
    return { data: null, message: e instanceof Error ? e.message : '' }
  }
}

export async function leaveRoom(roomName: string) {
  return apiRequest<DbRoom[]>(
    '/api/livekit/leave',
    {
      method: 'POST',
      keepalive: true,
    },
    { room_code: roomName }
  )
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

export async function generateCode(
  roomId: number
): Promise<{ code: string | null; message?: string }> {
  try {
    const res = await apiRequest<{ code: string }>(
      `/admin/rooms/${roomId}/regenerate-code?length=10`,
      {
        method: 'POST',
        cache: 'no-store',
      }
    )
    return { code: res.code }
  } catch (e) {
    return { code: null, message: e instanceof Error ? e.message : '' }
  }
}

export async function uploadRoomPresentation(id: number, file: File): Promise<{ path: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiRequest<{ path: string }>(`/admin/rooms/${id}/presentation`, {
    method: 'POST',
    body: formData,
  })

  return res
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

export async function fetchRoomToken(roomCode: string): Promise<DbRoom[]> {
  return apiRequest('/api/livekit/token', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify({ room_code: roomCode }),
  })
}

interface ChangeToModeratorPayload {
  room_code: string
  promote: boolean
}

interface ChangeToModeratorResponse {
  message: string
  promote: boolean
  room_code: string
}

export async function changeEveryoneToModerator(
  payload: ChangeToModeratorPayload
): Promise<ChangeToModeratorResponse> {
  return apiRequest('/admin/livekit/rooms/promote-all', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify(payload),
  })
}

export interface Group {
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

export interface ActiveRoom {
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

export async function updateMetadataPolling(payload: {
  room_id: number
  polling: PollingMessage[]
}): Promise<void> {
  await apiRequest('/api/livekit/livekit-polling', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface Permission {
  ID: number
  key: string
  description: string
  label?: string
}

export interface Role {
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

export interface User {
  id: number
  username: string
  email?: string
  role?: Role
  role_id: number
  status?: 'active' | 'inactive'
  presence?: string[]
}

export interface UserResponse {
  data: User[]
  page?: number
  limit?: number
  total?: number
  total_pages?: number
}

export interface ParamsUserAssignment {
  exclude_group_id?: number
  search?: string
}

export async function fetchUsers(props?: { params?: UserParams }): Promise<UserResponse> {
  const searchParams = props?.params ?? {}
  return apiRequest<UserResponse>(
    '/admin/users',
    {
      method: 'GET',
      cache: 'no-store',
    },
    { ...searchParams }
  )
}

export async function fetchUsersEvent() {
  return apiRequest('/admin/users/events', {
    method: 'GET',
    cache: 'no-store',
  })
}

export async function fetchUsersAssignment(params?: ParamsUserAssignment): Promise<User[]> {
  return apiRequest<User[]>(
    '/admin/users/assignment',
    {
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

export interface Recording {
  id: number
  room_id: string
  room_name: string
  name: string
  link: string
  egress_id: string
  status: 'STARTED' | 'PROCESSING' | 'COMPLETED'
  created_at: string
  duration: string
  duration_seconds: number
  started_at: number
  ended_at: number
  updated_at: number
}

export interface RecordingParams {
  room_id?: string
  search?: string
}

export type EgressRecordStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type LiveKitEgressStatus =
  | 'EGRESS_STARTING'
  | 'EGRESS_ACTIVE'
  | 'EGRESS_ENDING'
  | 'EGRESS_COMPLETE'
  | 'EGRESS_FAILED'
  | 'EGRESS_ABORTED'
  | 'EGRESS_LIMIT_REACHED'

export interface DefaultRecordingResponse {
  message: string
  egress_id: string
  room_name: string
  status: LiveKitEgressStatus
  record_status: EgressRecordStatus
  output_type: 'file' | 'hls' | ''
  output_name: string
}

export interface StartRecordingResponse extends DefaultRecordingResponse {
  started_at: number
}

export interface StopRecordingResponse extends DefaultRecordingResponse {
  record_url: string
  ended_at: number
  record?: Recording
}

export async function startRecording(payload: { room_name: string }) {
  return apiRequest<StartRecordingResponse>('/admin/livekit/recordings/start', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify(payload),
  })
}

export async function stopRecording(payload: { room_name: string; egress_id: string }) {
  return apiRequest<StopRecordingResponse>('/admin/livekit/recordings/stop', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify(payload),
  })
}

export async function fetchRecordings(params?: RecordingParams): Promise<Recording[]> {
  return apiRequest<Recording[]>(
    qstring('/admin/recordings', { ...params }, { skipEmpty: true, skipNulls: true }),
    {
      method: 'GET',
      cache: 'no-store',
    }
  )
}

export async function fetchRecordingVideo(id: number) {
  return await apiRequest<Blob>(`/api/recordings/${id}/video`, {
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
