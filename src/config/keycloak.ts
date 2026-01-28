export const keycloakConfig = {
    realm: 'Meet',
    clientId: 'meet-frontend',
    urls: {
        auth: 'http://localhost:8090/realms/Meet/protocol/openid-connect/auth',
        token: 'http://localhost:8090/realms/Meet/protocol/openid-connect/token',
        logout: 'http://localhost:8090/realms/Meet/protocol/openid-connect/logout',
        certs: 'http://localhost:8090/realms/Meet/protocol/openid-connect/certs',
    },
    routes: {
        login: '/login',
        callback: 'http://localhost:3000/callback',
        dashboard: '/dashboard',
    },
};
