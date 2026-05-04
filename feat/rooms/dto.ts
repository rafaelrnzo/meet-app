import * as yup from 'yup'
import { roomSchema } from './schema'
import { DbRoom } from '@/lib/api/admin-api'
import { djs } from '@/lib/utils'

type RoomSchemaValue = yup.InferType<typeof roomSchema>

interface SelectOptions {
  value: string
  label: string
}

const getRoomDefaultValue = (data: DbRoom): RoomSchemaValue => {
  return {
    ...data,
    startDate: djs(data.start_date).toDate(),
    endDate: djs(data.end_date).toDate(),
    password: data.password || '',
    groupId: data.group_id ? String(data.group_id) : '',
    maxParticipants: data.max_participants,
    assignedTo: data.assigned_to || [],
    isMuteOnStart: data.is_mute_on_start,
  }
}

const getRoomPayload = (data: RoomSchemaValue) => {
  return { ...data, is_mute_on_start: data.isMuteOnStart }
}

export type { RoomSchemaValue, SelectOptions }
export { getRoomDefaultValue, getRoomPayload }
