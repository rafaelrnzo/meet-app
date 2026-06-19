import type { JWT } from 'next-auth/jwt'
import { djs } from '@/lib/utils'
import { refreshToken } from '@/feat/Auth/api'

const REFRESH_TOKEN_BUFFER = 60 // Refresh 60 seconds before expiry

export function getAvatarFallbackInitials(name?: string) {
  if (!name) return ''

  const trimmedName = name.trim()
  const nameParts = trimmedName
    .split(' ')
    .map((item) => item.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean)

  if (nameParts.length > 1) {
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
  }

  return nameParts[0].substring(0, 2).toUpperCase()
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await refreshToken(token.refresh_token)

    if (response.status !== 200) {
      throw new Error('Token refresh failed')
    }

    const { access_token, expires_in, refresh_token: new_refresh_token } = response.data

    return {
      ...token,
      access_token,
      access_token_expired: Date.now() + expires_in * 1000,
      refresh_token: new_refresh_token ?? token.refresh_token,
      error: null,
    }
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(token: JWT): boolean {
  if (!token.expires_in) return true

  const currentTime = Math.floor(Date.now() / 1000)
  const expiryTime = token.expires_in

  return currentTime >= expiryTime - REFRESH_TOKEN_BUFFER
}

/**
 * Check if permissions need refresh
 */
export function shouldRefreshPermissions(token: JWT): boolean {
  const hasRolesAndPermissions = !!token.roles && !!token.permissions
  const isNotExpired = djs().unix() < djs(token?.expires_in).unix()

  return !hasRolesAndPermissions || !isNotExpired
}

/**
 * Create authorization headers
 */
export function createAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function fetcher<T>(input: URL | RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init)
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  if (!response.ok) throw response
  try {
    const json = await response.json()
    return { data: json as T, status: response.status }
  } catch {
    //
  }
  const text = await response.text()
  return { data: text } as { data: T; status: number }
}
