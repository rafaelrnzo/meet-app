"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, getUser, clearAuth, fetchProfile } from "@/lib/api/auth-client"
import { authService } from "@/src/services/auth";

export function useAuth(options?: { requireAdmin?: boolean; requirePermission?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [permissions, setPermissions] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    const storedUser = getUser()
    setUser(storedUser)

    const isAuthPage = pathname === "/login"

    if (!token) {
      setIsAuthenticated(false)
      setIsAdmin(false)
      setPermissions([])
      setLoading(false)

      if (!isAuthPage) {
        router.replace("/login")
      }
      return
    }

    setIsAuthenticated(true)

    // Helper to process user object
    const processUser = (u: any) => {
      let roleName = "user"
      let userPerms: string[] = []

      if (u?.role) {
        if (typeof u.role === "string") {
          roleName = u.role
        } else {
          roleName = u?.role?.name || "user"
          if (u.role.permissions && Array.isArray(u.role.permissions)) {
            userPerms = u.role.permissions.map((p: any) => p.key)
          }
        }
      }

      const admin = roleName === "admin"
      setIsAdmin(admin)
      setPermissions(userPerms)

      // Legacy admin check
      if (options?.requireAdmin && !admin) {
        router.replace("/")
        return
      }

      // New Permission check
      if (options?.requirePermission) {
        const has = admin || userPerms.includes(options.requirePermission)
        if (!has) {
          router.replace("/")
        }
      }
    }

    // Initial load from storage to update UI fast
    if (storedUser) {
      processUser(storedUser)
    }

    // Hydrate from backend to ensure permissions are fresh
    fetchProfile().then(freshUser => {
      setUser(freshUser)
      processUser(freshUser)
      // Optionally update localStorage here too
      // localStorage.setItem("vc_user", JSON.stringify(freshUser))
    }).catch(err => {
      console.error("Hydration failed", err)
    }).finally(() => {
      setLoading(false)
    })

  }, [router, pathname, options?.requireAdmin, options?.requirePermission])

  const logout = async () => {
    clearAuth()
    await authService.logout()
    router.replace("/login")
  }

  const hasPermission = (key: string) => {
    if (isAdmin) return true // Admin has all permissions implicitly or explicitly
    return permissions.includes(key)
  }

  return { loading, isAuthenticated, isAdmin, permissions, hasPermission, user, logout }
}
