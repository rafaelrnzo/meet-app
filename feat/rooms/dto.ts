import * as yup from 'yup'
import { roomSchema } from './schema'
import { DbRoom } from '@/lib/api/admin-api'
import { djs, omit } from '@/lib/utils'

type RoomSchemaValue = yup.InferType<typeof roomSchema>

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

const getRoomPayload = (data: RoomSchemaValue) => {
  return { ...omit(data, ['isMuteOnStart']), is_mute_on_start: data.isMuteOnStart }
}

export type { RoomSchemaValue, SelectOptions }
export { getRoomDefaultValue, getRoomPayload }
