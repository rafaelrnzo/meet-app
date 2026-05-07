// D:\proj\meet-FE\meet-fe-custom\lib\auth-client.ts

import { apiRequest } from './admin-api' // Using admin-api's generic apiRequest for consistency or similar

// Re-export types from admin-api or define here.
// Ideally we should consolidate.
// For now, let's just make sure we can fetch profile.

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

const TOKEN_KEY = 'vc_token'
const USER_KEY = 'vc_user'

export function isBrowser() {
  return typeof window !== 'undefined'
}

export function getToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): StoredUser | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setUser(user: StoredUser) {
  if (!isBrowser()) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  if (!isBrowser()) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
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
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || originBackend

  const res = await fetch(`${API_BASE}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}
