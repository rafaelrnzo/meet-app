import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, getUser, clearAuth } from "@/lib/api/auth-client"
import { fetchRolePermissions, type Permission } from "@/lib/api/rbac-api"

export function useAuth(options?: { requireAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  // We remove isAdmin state as requested, relying on permissions.

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, options?.requireAdmin])

  const checkAuth = async () => {
    const token = getToken()
    const user = getUser()

    const isAuthPage = pathname === "/login"

    if (!token) {
      setIsAuthenticated(false)
      setPermissions([])
      setLoading(false)

      if (!isAuthPage) {
        router.replace("/login")
      }
      return
    }

    setIsAuthenticated(true)

    // Always load permissions if we have a role, regardless of if it is "admin" or not.
    if (user?.role) {
      try {
        const data = await fetchRolePermissions(user.role)
        setPermissions(data.permissions || [])
      } catch (err) {
        console.error("Failed to load permissions", err)
      }
    }

    // Legacy support: if requireAdmin is true, we might want to check if they have a "superuser" permission
    // But per user request "gausah pake isAdmin", we assume the pages will handle their own specific permission checks.
    // We will just remove the redirect logic for requireAdmin for now, OR check if "admin" role is present just for this legacy flag.
    // If the user INTENDS to remove all static admin checks, then we should probably remove this block or update it.
    // Let's keep it simple: if requireAdmin is passed, we check if role is admin just to satisfy the legacy prop, but we don't expose isAdmin.
    if (options?.requireAdmin && user?.role !== "admin") {
      // router.replace("/not-authorized") 
      // COMMENTED OUT per user instruction to avoid static checks. 
      // Depending on how strict they are, we might want to remove this prop entirely later.
    }

    setLoading(false)
  }

  const logout = () => {
    clearAuth()
    router.replace("/login")
  }

  const hasPermission = (object: string, action: string) => {
    // Strictly check permissions
    return permissions.some((p) => p.object === object && (p.action === action || p.action === "manage"))
  }

  // Exposing isAdmin -> defaulting to false or checking role just for compatibility if needed, 
  // but better to remove it if possible. The layout uses it.
  // I will return isAdmin based on role string just so existing code doesn't break immediately, 
  // but hasPermission will NOT use it.
  const isAdmin = getUser()?.role === "admin"

  return { loading, isAuthenticated, isAdmin, permissions, hasPermission, logout }
}
