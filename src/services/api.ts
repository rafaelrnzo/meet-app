import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth';
import { keycloakConfig } from '../config/keycloak';

// Extend Axios Request Config to include the _retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const api = axios.create({
    baseURL: typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8080/api`
        : 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const tokens = authService.getTokens();
        if (tokens?.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const tokens = authService.getTokens();

            if (tokens?.refreshToken) {
                try {
                    const params = new URLSearchParams({
                        grant_type: 'refresh_token',
                        client_id: keycloakConfig.clientId,
                        refresh_token: tokens.refreshToken,
                    });

                    const response = await axios.post(
                        keycloakConfig.urls.token,
                        params,
                        {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        }
                    );

                    const newTokens = response.data;

                    // Merge with existing tokens (Keycloak might not return a new refresh token every time)
                    const mergedTokens = {
                        ...tokens, // preserve old values (like id_token if not rotated)
                        ...newTokens, // overwrite with new ones
                        // Ensure we use the new refresh token if provided, otherwise fail-safe to old one? 
                        // Actually, if Keycloak doesn't return a refresh token, usually the old one is still valid.
                        refresh_token: newTokens.refresh_token || tokens.refreshToken,
                    };

                    // Fix mapping for authService structure if needed. 
                    // authService.setTokens expects simple object but mergedTokens follows response + local storage mixed naming.
                    // Let's normalize to what authService.setTokens expects.
                    authService.setTokens({
                        access_token: mergedTokens.access_token,
                        refresh_token: mergedTokens.refresh_token,
                        id_token: mergedTokens.id_token,
                        expires_in: mergedTokens.expires_in
                    });

                    // Process queued requests
                    processQueue(null, newTokens.access_token);

                    // Retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    authService.logout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                authService.logout();
            }
        }

        return Promise.reject(error);
    }
);

export default api;
