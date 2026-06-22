'use server'

import type { RefreshTokenResponseDTO } from '@/feat/Auth/dto'
import { auth, signOut } from '@/lib/auth'
import { fetcher } from '@/feat/Auth/helpers'
import { qstring } from '@/lib/utils'

// API Endpoints
const KEYCLOAK_ID = process.env.KEYCLOAK_ID ?? ''
const KEYCLOAK_SECRET = process.env.KEYCLOAK_SECRET ?? ''
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER ?? ''

/**
 * Refresh the access token using the refresh token
 */
export async function refreshToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_ID,
    client_secret: KEYCLOAK_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  return await fetcher<RefreshTokenResponseDTO>(
    [KEYCLOAK_ISSUER, '/protocol/openid-connect/token'].join(''),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )
}

/**
 * Remove session on the server and clean cookie session
 */
export async function logoutSession() {
  const API_LOGOUT = [process.env.KEYCLOAK_ISSUER, '/protocol/openid-connect/logout'].join('')

  try {
    const session = await auth()
    const params = new URLSearchParams({
      client_id: KEYCLOAK_ID,
      client_secret: KEYCLOAK_SECRET,
      refresh_token: session?.refresh_token ?? '',
    })

    await signOut({ redirect: false })
    await fetcher(qstring(API_LOGOUT, params), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (e) {
    console.log(e)
  }
}
