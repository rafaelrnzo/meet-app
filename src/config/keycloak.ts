const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://localhost'
const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'Meet'
const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'meet-frontend'

/**
 * Configuration object for Keycloak authentication.
 * Contains the Keycloak server URL, realm, client ID,
 * and standard OpenID Connect endpoints for authentication flow.
 */
export const keycloakConfig = {
  url: keycloakUrl,
  realm,
  clientId,
  urls: {
    auth: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`,
    token: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
    logout: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`,
    certs: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
  },
  routes: {
    login: '/login',
    callback: '/callback',
    dashboard: '/dashboard',
  },
}
