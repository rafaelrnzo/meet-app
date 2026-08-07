import { default as React } from 'react'
import { auth } from '@/lib/auth'
import { AuthGuard } from '@/feat/Auth/AuthGuard'

async function RoomsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return <AuthGuard isLogin={!!session}>{children}</AuthGuard>
}

export default RoomsLayout
