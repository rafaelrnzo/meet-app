"use client"

import * as React from "react"
import { useAuth } from "../hooks/use-auth"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
