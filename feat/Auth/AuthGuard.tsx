'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function AuthGuard({ children, isLogin }: { children: React.ReactNode; isLogin: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!isLogin) {
      const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`

      router.push(`/api/verify?from=${encodeURIComponent(currentPath)}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin, pathname, searchParams])

  return children
}

export { AuthGuard }
