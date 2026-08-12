'use client'

import { default as React } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sidebarItems } from '@/lib/menu-items'
import { getRoleLabel } from '@/lib/helpers'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/hooks/use-auth'
import { SidebarList } from '@/compounds/sidebar/sidebar-list'
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { isAuthenticated, isAdmin, user, role, hasPermission } = useAuth()
  const { openMobile } = useSidebar()

  if (!isAuthenticated) {
    return null
  }

  const username = user?.username ?? 'Unknown'
  const roleName = role?.name ?? ''
  const roleLabel = getRoleLabel(roleName)
  const menuItems = sidebarItems({ isAdmin, hasPermission })

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
                {menuItems.find((i) => i.href === pathname)?.label ?? 'Dashboard'}
              </h1>
            </div>

            <div className='flex items-center gap-2'>
              <span className='rounded-md border border-red-400 px-2 py-[3.5px] text-xs leading-4.25 font-medium text-red-800 first-letter:uppercase'>
                {isMobile ? roleLabel.charAt(0) : roleLabel}
              </span>
              <div className='ring-background flex size-8 items-center justify-center rounded-full bg-red-800 text-sm font-semibold text-neutral-50 ring-2 max-md:hidden'>
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className='flex-1 overflow-y-auto p-8 max-md:pt-18'>
            {/* <div className='animate-in fade-in mx-auto max-w-7xl duration-500'></div> */}
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  )
}
