// D:\proj\meet-FE\meet-fe-custom\hooks\use-auth.ts

"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, getUser, clearAuth } from "@/lib/auth-client"

export function useAuth(options?: { requireAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    const token = getToken()
    const user = getUser()

    if (!token) {
      setIsAuthenticated(false)
      setIsAdmin(false)
      setLoading(false)
      // kalau path bukan login/register, redirect ke login
      if (!pathname?.startsWith("/(auth)") && pathname !== "/login") {
        router.replace("/login")
      }
      return
    }

    setIsAuthenticated(true)
    const admin = user?.role === "admin"
    setIsAdmin(admin)

    // kalau butuh admin tapi bukan admin → bisa redirect
    if (options?.requireAdmin && !admin) {
      router.replace("/not-authorized")
    }

    setLoading(false)
  }, [router, pathname, options?.requireAdmin])

  const logout = React.useCallback(() => {
    clearAuth()
    router.replace("/login")
  }, [router])

  return {
    loading,
    isAuthenticated,
    isAdmin,
    logout,
  }
}
