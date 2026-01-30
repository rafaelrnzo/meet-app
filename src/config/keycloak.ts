export const keycloakConfig = {
    realm: 'Meet',
    clientId: 'meet-frontend',
    urls: {
        auth: 'http://192.168.100.130:8090/realms/Meet/protocol/openid-connect/auth',
        token: 'http://192.168.100.130:8090/realms/Meet/protocol/openid-connect/token',
        logout: 'http://192.168.100.130:8090/realms/Meet/protocol/openid-connect/logout',
        certs: 'http://192.168.100.130:8090/realms/Meet/protocol/openid-connect/certs',
    },
    routes: {
        login: '/login',
        callback: '/callback',
        dashboard: '/dashboard',
    },
};
