'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { sidebarItems } from '@/lib/menu-items'
import { useIsMobile } from '@/hooks/use-mobile'
import { SidebarList } from '@/compounds/sidebar/sidebar-list'
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const {
    loading,
    isAuthenticated,
    isAdmin,
    hasPermission,
    user = {
      username: 'superadmin',
      role: {
        name: 'superadmin',
      },
    },
  } = useAuth()
  const { openMobile } = useSidebar()

  if (loading) {
    return (
      <div className='bg-background text-foreground flex min-h-screen w-full items-center justify-center'>
        <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const username = user?.username || 'Unknown'
  const role = user.role || (isAdmin ? 'admin' : 'user')
  const roleName = role.name
  const menuItems = sidebarItems({ isAdmin, hasPermission: () => true })

  return (
    <>
      <SidebarList user={user} />
      <SidebarInset>
        <main>
          <header
            className={cn(
              'fixed top-0 z-50 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 transition-[width,height] ease-linear md:sticky md:h-14',
              isMobile && openMobile && 'z-51'
            )}
          >
            {isMobile && <SidebarTrigger />}

            <div className='flex items-center gap-2'>
              {!isMobile && <SidebarTrigger />}
              <h1 className='text-sm text-red-800 capitalize'>
                {menuItems.find((i) => i.href === pathname)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className='flex items-center gap-2'>
              <span className='rounded-md border border-red-400 px-2 py-[3.5px] text-xs leading-[17px] font-medium text-red-800 first-letter:uppercase'>
                {isMobile ? roleName.charAt(0) : roleName}
              </span>
              <div className='ring-background flex size-8 items-center justify-center rounded-full bg-red-800 text-sm font-semibold text-neutral-50 ring-2 max-md:hidden'>
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className='flex-1 overflow-y-auto p-8 max-md:pt-18'>
            <div className='animate-in fade-in mx-auto max-w-7xl duration-500'>{children}</div>
          </div>
        </main>
      </SidebarInset>
    </>
  )
}
