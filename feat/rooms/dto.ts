import type * as yup from 'yup'
import type { DbRoom } from '@/lib/api/admin-api'
import type { PollingMessage } from '@/components/PollingCard'
import type { roomSchema } from './schema'
import { djs } from '@/lib/utils'

type RoomSchemaValue = yup.InferType<ReturnType<typeof roomSchema>>

type TabsValue = 'overview' | 'participants' | 'settings'

type StatusOption = 'all' | 'waiting' | 'banned'

type FileResponse = {
  file_name: string
  file_url: string
  size: number
}

interface RoomPayload {
  name: string
  description: string
  max_participants: number
  assigned_to: string[] | null
  group_id: number
  start_date: string
  end_date: string
  password: string
  is_mute_on_start: boolean
  enable_start_room: boolean
}

interface SelectOptions {
  value: string
  label: string
}

interface NewRoomCode {
  roomId: number
  code: string
}

interface GenerateRoomCodeExp {
  roomId: number
  exp: number
}

const getRoomDefaultValue = (data: DbRoom): RoomSchemaValue => {
  return {
    name: data.name,
    description: data.description,
    maxParticipants: data.max_participants,
    assignedTo: data.assigned_to || [],
    groupId: data.group_id ? String(data.group_id) : '',
    startDate: djs(data.start_date).toDate(),
    endDate: djs(data.end_date).toDate(),
    password: data.password || '',
    isMuteOnStart: data.is_mute_on_start,
    totalGroupMember: 0,
    enableStartRoom: data.enable_start_room,
  }
}

const getRoomPayload = (data: RoomSchemaValue): RoomPayload => {
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    max_participants: Number(data.maxParticipants),
    assigned_to: data.assignedTo,
    group_id: data.groupId ? Number(data.groupId) : 0,
    start_date: data.startDate?.toISOString() ?? '',
    end_date: data.endDate?.toISOString() ?? '',
    password: data.password,
    is_mute_on_start: data.isMuteOnStart,
    enable_start_room: data.enableStartRoom,
  }
}

const SORT_ROOM = ['newest', 'oldest', 'name_asc', 'name_desc', 'group'] as const

type SortRoomType = (typeof SORT_ROOM)[number]

enum RoomSSEEvent {
  RoomUpdated = 'room_updated',
  ParticipantJoined = 'participant_joined',
  ParticipantLeft = 'participant_left',
  RecordingStarted = 'recording_started',
  RecordingStopped = 'recording_stopped',
}

interface RoomEventUpdated {
  type: RoomSSEEvent.RoomUpdated
  data: {
    is_live: boolean
    participants: number
    room_id: string
    updated_at: string
  }
}

interface RoomEventParticipantData {
  room_id: string
  identity: string
  participant_count: number
}

interface RoomEventParticipant {
  type: RoomSSEEvent.ParticipantJoined | RoomSSEEvent.ParticipantLeft
  data: RoomEventParticipantData
}

type RoomSSEDTO = RoomEventUpdated | RoomEventParticipant

interface RoomMetadata {
  banned_users: string[]
  banned_users_name: any[]
  polling: PollingMessage[]
  room_id: number
}

export type {
  RoomSchemaValue,
  SelectOptions,
  SortRoomType,
  RoomPayload,
  NewRoomCode,
  GenerateRoomCodeExp,
  TabsValue,
  StatusOption,
  FileResponse,
  RoomSSEDTO,
  RoomMetadata,
}
export { getRoomDefaultValue, getRoomPayload, SORT_ROOM, RoomSSEEvent }
