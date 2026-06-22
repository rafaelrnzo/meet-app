import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ProtectedContent } from '@/app/(protected)/client'
import { auth } from '@/lib/auth'
import { fetcher } from '@/feat/Auth/helpers'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    const { data } = await fetcher<{ callbackUrl: string }>(
      process.env.KEYCLOAK_REDIRECT_URI + '/api/verify',
      {
        method: 'POST',
      }
    )

    return redirect(data.callbackUrl)
  }

  return (
    <SidebarProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </SidebarProvider>
  )
}
