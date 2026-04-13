'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/src/services/auth'

/**
 * A wrapper component that checks for user authentication.
 * If the user is unauthenticated, they will be redirected to the login page.
 * If authenticated, it renders the protected children components.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The protected content to render.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login')
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) {
    return <div style={{ padding: '20px' }}>Checking authentication...</div>
  }

  return <>{children}</>
}
