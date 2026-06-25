import type { User } from '@/lib/api/admin-api'

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
