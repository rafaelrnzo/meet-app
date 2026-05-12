import axios, { AxiosError } from 'axios'
import { keycloakConfig } from '../config/keycloak'
import Cookies from 'js-cookie'

interface Tokens {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
}

const getBackendUrl = () =>
  (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080'
  ).replace(/\/+$/, '')

/**
 * Authentication service handling login, token exchange, and logout
 * using Keycloak OpenID Connect and synchronizing with the backend.
 */
export const authService = {
  /**
   * Initiates the login flow by redirecting the user to the Keycloak auth page.
   */
  login: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams({
      client_id: keycloakConfig.clientId,
      redirect_uri: `${origin}${keycloakConfig.routes.callback}`,
      client_secret: keycloakConfig.clientSecret,
      response_type: 'code',
      scope: 'openid profile email',
    })
    window.location.href = `${keycloakConfig.urls.auth}?${params.toString()}`
  },

  /**
   * Exchanges an authorization code for access tokens from Keycloak,
   * and performs a Single Sign-On (SSO) login with the local backend.
   *
   * @param {string} code - The authorization code received from Keycloak.
   * @returns {Promise<Tokens>} A promise that resolves to the token payload from Keycloak.
   */
  exchangeToken: async (code: string): Promise<Tokens> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      redirect_uri: `${origin}${keycloakConfig.routes.callback}`,
      code,
    })

    const response = await axios.post<Tokens>(keycloakConfig.urls.token, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    // SYNC WITH BACKEND
    try {
      const payload = JSON.parse(atob(response.data.id_token.split('.')[1]))
      const username = payload.preferred_username || payload.name || payload.sub
      const email = payload.email || ''
      const backendUrl = getBackendUrl()

      const apiRes = await axios.post(
        `${backendUrl}/sso-login`,
        {
          username,
          email,
          token: response.data.access_token,
        },
        {
          headers: {
            Authorization: `Bearer ${response.data.access_token}`,
          },
        }
      )

      const cookieOptions = { expires: 7, sameSite: 'lax' } as const
      Cookies.set('token', response.data.access_token, cookieOptions)
      Cookies.set('vc_token', response.data.access_token, cookieOptions)
      Cookies.set('access_token', response.data.access_token, cookieOptions)
      Cookies.set('refresh_token', response.data.refresh_token, cookieOptions)
      Cookies.set('id_token', response.data.id_token, cookieOptions)

      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('vc_token', response.data.access_token)
      localStorage.setItem('access_token', response.data.access_token)

      if (apiRes.data.username) {
        const userData = JSON.stringify({
          id: apiRes.data.user_id,
          username: apiRes.data.username,
          role: apiRes.data.role,
        })
        Cookies.set('vc_user', userData, cookieOptions)
        localStorage.setItem('vc_user', userData)
      }
    } catch (e) {
      console.error('Failed to sync SSO user with backend', e)
      // Fallback: Store access_token in cookies even if backend synchronization failed.
      const cookieOptions = { expires: 7, sameSite: 'lax' } as const
      if (typeof window !== 'undefined' && !Cookies.get('token')) {
        Cookies.set('token', response.data.access_token, cookieOptions)
        Cookies.set('vc_token', response.data.access_token, cookieOptions)
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('vc_token', response.data.access_token)
      }
    }

    return response.data
  },

  /**
   * Logs out the user by clearing local authentication tokens
   * and redirecting to the Keycloak logout endpoint.
   */
  logout: async () => {
    const refreshToken = Cookies.get('refresh_token') || localStorage.getItem('refresh_token') || ''
    const params = new URLSearchParams({
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      refresh_token: refreshToken,
      post_logout_redirect_uri: window.location.origin,
    })

    try {
      await axios.post(keycloakConfig.urls.logout, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      return { error: null }
    } catch (e) {
      console.error('Keycloak logout request failed', e)
      if (e instanceof AxiosError) {
        return { error: e.response?.data.error_description ?? e.message }
      }

      if (e instanceof Error) {
        return { error: e.message }
      }

      return { error: 'Gagal logout' }
    }
  },

  /**
   * Retrieves the stored authentication tokens from cookies or local storage.
   *
   * @returns {Object|null} An object containing accessToken, refreshToken, and idToken.
   */
  getTokens: () => {
    if (typeof window === 'undefined') return null
    return {
      accessToken:
        Cookies.get('token') ||
        Cookies.get('vc_token') ||
        Cookies.get('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('vc_token') ||
        localStorage.getItem('access_token'),
      refreshToken: Cookies.get('refresh_token') || localStorage.getItem('refresh_token'),
      idToken: Cookies.get('id_token') || localStorage.getItem('id_token'),
    }
  },

  /**
   * Stores the given authentication tokens into cookies and local storage.
   *
   * @param {Tokens} tokens - The token payload from Keycloak.
   */
  setTokens: (tokens: Tokens) => {
    const cookieOptions = { expires: 7, sameSite: 'lax' } as const
    Cookies.set('access_token', tokens.access_token, cookieOptions)
    Cookies.set('refresh_token', tokens.refresh_token, cookieOptions)
    Cookies.set('id_token', tokens.id_token, cookieOptions)
    Cookies.set('token', tokens.access_token, cookieOptions)
    Cookies.set('vc_token', tokens.access_token, cookieOptions)

    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    localStorage.setItem('id_token', tokens.id_token)
    localStorage.setItem('token', tokens.access_token)
    localStorage.setItem('vc_token', tokens.access_token)
  },

  /**
   * Checks if the user is currently authenticated based on token presence.
   *
   * @returns {boolean} True if an access token exists, false otherwise.
   */
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false
    return !!(
      Cookies.get('token') ||
      Cookies.get('vc_token') ||
      Cookies.get('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('vc_token') ||
      localStorage.getItem('access_token')
    )
  },
}

// Token Refresh Logic
if (typeof window !== 'undefined') {
  const refreshToken = async () => {
    const tokens = authService.getTokens()
    if (tokens?.accessToken && tokens?.refreshToken) {
      try {
        // Simple decode to check expiry
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]))
        const expiresIn = payload.exp - Date.now() / 1000

        if (expiresIn < 300) {
          // 5 minutes before expire
          const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: keycloakConfig.clientId,
            client_secret: keycloakConfig.clientSecret,
            refresh_token: tokens.refreshToken,
          })

          const response = await axios.post(keycloakConfig.urls.token, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })

          authService.setTokens(response.data)
        }
      } catch (e) {
        console.error('Failed to auto-refresh token', e)
      }
    }
  }
  setInterval(refreshToken, 60000) // Check every minute
}
