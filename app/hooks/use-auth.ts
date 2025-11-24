"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, getUser, clearAuth } from "@/lib/auth-client"

export function useAuth(options?: { requireAdmin?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = getToken()
    const user = getUser()

    const isAuthPage = pathname === "/login"

    if (!token) {
      setIsAuthenticated(false)
      setIsAdmin(false)
      setLoading(false)

      if (!isAuthPage) {
        router.replace("/login")
      }
      return
    }

    setIsAuthenticated(true)
    const admin = user?.role === "admin"
    setIsAdmin(admin)

    if (options?.requireAdmin && !admin) {
      router.replace("/not-authorized")
    }

    setLoading(false)
  }, [router, pathname, options?.requireAdmin])

  const logout = () => {
    clearAuth()
    router.replace("/login")
  }

  return { loading, isAuthenticated, isAdmin, logout }
}
