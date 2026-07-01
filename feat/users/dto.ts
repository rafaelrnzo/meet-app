import type { User } from '@/lib/api/admin-api'

export enum UserSSEType {
  CONNECTED = 'connected',
  PING = 'ping',
  UPDATE = 'user_updated',
  DELETE = 'user_deleted',
}

export type UserSSE = {
  type: UserSSEType
  data?: Users & {
    status?: string
    room_id?: string
    participant_count?: number
    [key: string]: any
  }
}

export enum UserPrensence {
  ACTIVE = 'active',
  WAITING = 'waiting to join',
  IDLE = 'idle',
  BANNED = 'banned',
}

export type Users = User

export interface UserParams {
  presence?: UserPrensence | 'all'
  limit?: number
  sort?: 'id' | 'username' | 'email' | 'status' | 'created_at' | 'updated_at'
  order?: 'ASC' | 'DESC'
}
