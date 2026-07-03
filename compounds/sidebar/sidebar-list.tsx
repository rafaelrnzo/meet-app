'use client'

import type { AuthProfileDTO } from '@/feat/Auth/dto'
import * as React from 'react'
import { usePathname } from 'next/navigation'
import { default as Link } from 'next/link'
import { sidebarItems } from '@/lib/menu-items'
import { useAuth } from '@/hooks/use-auth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

function SidebarList({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: AuthProfileDTO }) {
  const { toggleSidebar } = useSidebar()
  const { isAdmin, hasPermission, logout } = useAuth()
  const pathname = usePathname()
  const menuItems = sidebarItems({ isAdmin, hasPermission }).filter((item) => item.hasPermission)

  return (
    <Sidebar collapsible='icon' className='bg-white' {...props}>
      <SidebarHeader className='flex w-full flex-row items-center gap-2 px-8 py-8 md:px-3 md:py-6'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-md bg-red-800 text-lg font-bold text-white uppercase'>
          {user?.username?.charAt(0) ?? 'V'}
        </div>
        <h1 className='grow truncate font-semibold text-red-800 first-letter:uppercase'>
          {user?.username}
        </h1>
        <Button className='size-11 md:hidden' variant='destructive' onClick={() => toggleSidebar()}>
          <Icon type='close' />
        </Button>
      </SidebarHeader>
      <SidebarContent className='mb-8 gap-4 px-8 group-data-[collapsible=icon]:overflow-y-auto md:mb-6 md:px-3'>
        <SidebarGroup className='flex-1 p-0'>
          <SidebarGroupContent>
            <SidebarMenu className='gap-4'>
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      asChild
                      size='lg'
                      variant='primary'
                      className='group pr-0.5'
                      isActive={isActive}
                    >
                      <Link href={item.href} title={item.label}>
                        <Icon type={item.icon} />
                        <span className='group-data-[collapsible=icon]:hidden'>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip='Keluar' size='lg' variant='destructive' onClick={logout}>
              <Icon type='logout' />
              <span className='group-data-[collapsible=icon]:hidden'>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

export { SidebarList }
