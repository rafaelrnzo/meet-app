export function useAuth(options?: { requireAdmin?: boolean; requirePermission?: string }) {
  // const session = useSession()

  return {
    loading: false,
    isAuthenticated: true,
    isAdmin: true,
    permissions: [],
    hasPermission: true,
    user: null,
    logout: () => {},
  }
}
