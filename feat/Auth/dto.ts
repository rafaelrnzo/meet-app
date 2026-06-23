export interface RefreshTokenResponseDTO {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  refresh_token: string
  token_type: string
  scope: string
}

export interface PermissionDTO {
  ID: number
  CreatedAt: string
  UpdatedAt: string
  DeletedAt: string | null
  key: string
  label: string
  description: string
  scope: string
}

export interface RoleDTO {
  id: number
  name: string
  description: string
  permissions: PermissionDTO[]
  created_at: string
  updated_at: string
}

export interface AuthProfileDTO {
  email: string
  id: number
  role: RoleDTO
  username: string
}

export interface AuthDTO {
  access_token: string
  expires_in: number
  expires_at: number
  refresh_expires_in: number
  refresh_token: string
  token_type: string
  'not-before-policy': number
  session_state: string
  scope: string
  profile: AuthProfileDTO
}

export interface ResponseBase<T> {
  data: T
  error?: { message: string }
}
