import type { User } from '@/lib/api/admin-api'

export type ManagaStatus = 'active' | 'inactive'

export type RoomStatus = 'all' | 'waiting' | 'banned'

export type Users = User

export interface UserParams {
  status?: RoomStatus
}
