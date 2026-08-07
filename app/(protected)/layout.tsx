import { default as React } from 'react'
import { auth } from '@/lib/auth'
import { AuthGuard } from '@/feat/Auth/AuthGuard'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ProtectedContent } from '@/app/(protected)/client'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <AuthGuard isLogin={!!session}>
      <SidebarProvider>
        <ProtectedContent>{children}</ProtectedContent>
      </SidebarProvider>
    </AuthGuard>
  )
}
