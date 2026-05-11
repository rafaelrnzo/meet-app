import type * as yup from 'yup'
import type { roomSchema } from './schema'
import type { DbRoom } from '@/lib/api/admin-api'
import { djs } from '@/lib/utils'

type RoomSchemaValue = yup.InferType<ReturnType<typeof roomSchema>>

interface RoomPayload {
  name: string
  description: string
  max_participants: number
  assigned_to: string[]
  group_id: number
  start_date: string
  end_date: string
  password: string
  is_mute_on_start: boolean
}

interface SelectOptions {
  value: string
  label: string
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
  }
}

const SORT_ROOM = ['newest', 'oldest', 'name_asc', 'name_desc', 'group'] as const

type SortRoomType = (typeof SORT_ROOM)[number]

export type { RoomSchemaValue, SelectOptions, SortRoomType, RoomPayload }
export { getRoomDefaultValue, getRoomPayload, SORT_ROOM }
