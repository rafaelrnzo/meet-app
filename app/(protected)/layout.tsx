import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ProtectedContent } from '@/app/(protected)/client'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </SidebarProvider>
  )
}
