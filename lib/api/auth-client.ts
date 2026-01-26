// D:\proj\meet-FE\meet-fe-custom\lib\auth-client.ts

export type StoredUser = {
  username?: string
  role?: string | { name: string }
}

const TOKEN_KEY = "vc_token"
const USER_KEY = "vc_user"

export function isBrowser() {
  return typeof window !== "undefined"
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

export function clearAuth() {
  if (!isBrowser()) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
