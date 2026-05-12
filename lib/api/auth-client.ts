// D:\proj\meet-FE\meet-fe-custom\lib\auth-client.ts

export type Permission = {
  id: number
  key: string
  description: string
}

export type Role = {
  id: number
  name: string
  permissions?: Permission[]
}

export type StoredUser = {
  id?: number
  username?: string
  role?: string | Role
}

import Cookies from 'js-cookie'

const TOKEN_KEY = 'token'
const BACKUP_TOKEN_KEY = 'vc_token'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const ID_TOKEN_KEY = 'id_token'
const USER_KEY = 'vc_user'

export function isBrowser() {
  return typeof window !== 'undefined'
}

export function getToken(): string | null {
  if (!isBrowser()) return null
  return (
    Cookies.get(TOKEN_KEY) ||
    Cookies.get(BACKUP_TOKEN_KEY) ||
    Cookies.get(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(BACKUP_TOKEN_KEY) ||
    localStorage.getItem(ACCESS_TOKEN_KEY)
  )
}

export function getUser(): StoredUser | null {
  if (!isBrowser()) return null
  const raw = Cookies.get(USER_KEY) || localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setUser(user: StoredUser) {
  if (!isBrowser()) return
  const data = JSON.stringify(user)
  Cookies.set(USER_KEY, data, { expires: 7, sameSite: 'lax' })
  localStorage.setItem(USER_KEY, data)
}

export function clearAuth() {
  if (!isBrowser()) return
  const keys = [TOKEN_KEY, BACKUP_TOKEN_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ID_TOKEN_KEY, USER_KEY]
  keys.forEach(key => {
    Cookies.remove(key)
    localStorage.removeItem(key)
  })
}

export async function fetchProfile(): Promise<StoredUser> {
  // We can't import apiRequest from admin-api easily if it has dependencies?
  // Let's copy a simple fetch logic or use admin-api if it's safe.
  // admin-api.ts seems to use NEXT_PUBLIC_BACKEND_URL.

  // Let's implement a simple fetch here to avoid circular deps if any.
  const token = getToken()
  if (!token) throw new Error('No token')

  const originBackend =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:8080`
      : 'http://localhost:8080'
  const API_BASE =
    (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/+$/, '') ||
    originBackend

  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    throw new Error(`Failed to reach backend profile endpoint at ${API_BASE}/api/me`, {
      cause: error,
    })
  }

  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}
