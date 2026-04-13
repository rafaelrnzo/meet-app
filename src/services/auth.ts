import axios from 'axios';
import { keycloakConfig } from '../config/keycloak';

interface Tokens {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
}

/**
 * Authentication service handling login, token exchange, and logout
 * using Keycloak OpenID Connect and synchronizing with the backend.
 */
export const authService = {
    /**
     * Initiates the login flow by redirecting the user to the Keycloak auth page.
     */
    login: () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams({
            client_id: keycloakConfig.clientId,
            redirect_uri: `${origin}${keycloakConfig.routes.callback}`,
            response_type: 'code',
            scope: 'openid profile email',
        });
        window.location.href = `${keycloakConfig.urls.auth}?${params.toString()}`;
    },

    /**
     * Exchanges an authorization code for access tokens from Keycloak,
     * and performs a Single Sign-On (SSO) login with the local backend.
     * 
     * @param {string} code - The authorization code received from Keycloak.
     * @returns {Promise<Tokens>} A promise that resolves to the token payload from Keycloak.
     */
    exchangeToken: async (code: string): Promise<Tokens> => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: keycloakConfig.clientId,
            redirect_uri: `${origin}${keycloakConfig.routes.callback}`,
            code,
        });

        const response = await axios.post<Tokens>(
            keycloakConfig.urls.token,
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        // SYNC WITH BACKEND
        try {
            // Need to decode id_token to get username/email or call userinfo
            // Simple way: just ignore detailed error if sync fails, but ideally we want it.
            // Let's assume we decode ID token or just pass it? 
            // The backend endpoint `/sso-login` expects { username, email }.
            // Let's rely on `id_token` decoding.
            // Since we don't have a jwt decoder handy here (maybe), we can try to simplistic parse.

            const payload = JSON.parse(atob(response.data.id_token.split('.')[1]));
            const username = payload.preferred_username || payload.name || payload.sub;
            const email = payload.email || "";
            const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}`

            const apiRes = await axios.post(`${backendUrl}/sso-login`, {
                username,
                email
            });

            // Backend returns a new token, but we might want to keep using Keycloak's token for ID?
            // Or backend token? 
            // The current app seems to use `localStorage` directly in `auth-client.ts`.
            // Wait, `auth.ts` uses `access_token` from Keycloak?
            // If the app uses Keycloak token for backend, then backend must validate Keycloak token!
            // BUT my backend `JWTAuthMiddleware` validates its OWN tokens (HS256 with "my-secret").
            // So we MUST use the token returned by `/sso-login`.

            if (apiRes.data.token) {
                // OVERRIDE user token with Backend Token? 
                // This is tricky. If we use 2 systems. 
                // But the user said "sso is already successfully used", implies previous setup worked?
                // If previous setup worked, how did backend validate?
                // Previous backend didn't seem to have valid OIDC validation logic (I didn't see verify).
                // It had `utility.ParseJWT`.

                // My plan: Keep the Keycloak logic for frontend state, but store Backend Token for API calls?
                // `auth-client.ts` uses `vc_token`. `auth.ts` uses `access_token`.
                // This suggests `auth.ts` is the new one for Keycloak?

                // Let's store the backend token in 'vc_token' (which `auth-client.ts` uses) 
                // and Keycloak token in 'access_token' (which `auth.ts` uses).

                localStorage.setItem("vc_token", apiRes.data.token);
                localStorage.setItem("vc_user", JSON.stringify({
                    username: apiRes.data.username,
                    role: apiRes.data.role // This is likely an object now
                }));
            }
        } catch (e) {
            console.error("Failed to sync SSO user with backend", e);
        }

        return response.data;
    },

    /**
     * Logs out the user by clearing local authentication tokens
     * and redirecting to the Keycloak logout endpoint.
     */
    logout: async () => {
        const params = new URLSearchParams({
            client_id: keycloakConfig.clientId,
            refresh_token: localStorage.getItem('refresh_token') ?? '',
            post_logout_redirect_uri: window.location.origin,
        });

        // Clear local tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('id_token')

        await axios.post(keycloakConfig.urls.logout, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
  },

    /**
     * Retrieves the stored authentication tokens from local storage.
     * 
     * @returns {Object|null} An object containing accessToken, refreshToken, and idToken.
     */
    getTokens: () => {
        if (typeof window === 'undefined') return null;
        return {
            accessToken: localStorage.getItem('access_token'),
            refreshToken: localStorage.getItem('refresh_token'),
            idToken: localStorage.getItem('id_token'),
        };
    },

    /**
     * Stores the given authentication tokens into local storage.
     * 
     * @param {Tokens} tokens - The token payload from Keycloak.
     */
    setTokens: (tokens: Tokens) => {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        localStorage.setItem('id_token', tokens.id_token);
    },

    /**
     * Checks if the user is currently authenticated based on local storage token presence.
     * 
     * @returns {boolean} True if an access token exists, false otherwise.
     */
    isAuthenticated: () => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('access_token');
    }
};
