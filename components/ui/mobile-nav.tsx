'use client'

import { default as React } from 'react'
import { usePathname } from 'next/navigation'
import { default as Link } from 'next/link'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sidebarItems } from '@/lib/menu-items'
import { useAuth } from '@/hooks/use-auth'
import { Icon } from '@/components/ui/icon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function MobileNav() {
  const pathname = usePathname()
  const { isAdmin, hasPermission } = useAuth()
  const menuItems = sidebarItems({ isAdmin, hasPermission })

  // Filter items based on permission
  const visibleItems = menuItems.filter((item) => item.hasPermission)

  if (visibleItems.length === 0) return null

  const mainItems = visibleItems.slice(0, 4)
  const moreItems = visibleItems.slice(4)

  return (
    <nav className='bg-background/80 border-border pb-safe fixed right-0 bottom-0 left-0 z-50 block h-16 border-t backdrop-blur-lg md:hidden'>
      <div className='flex h-full items-center justify-around px-2'>
        {mainItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon type={item.icon} className='h-5 w-5' />
              <span className='text-[10px] font-medium'>{item.label}</span>
            </Link>
          )
        })}

        {moreItems.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <button className='text-muted-foreground hover:text-foreground flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors'>
                <Menu className='h-5 w-5' />
                <span className='text-[10px] font-medium'>More</span>
              </button>
            </DialogTrigger>
            <DialogContent className='w-[90%] rounded-xl'>
              <DialogHeader>
                <DialogTitle>Menu</DialogTitle>
              </DialogHeader>
              <div className='grid grid-cols-3 gap-4 py-4'>
                {moreItems.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center rounded-lg border p-3 shadow-sm transition-colors',
                        isActive && 'border-primary/50 bg-primary/5 text-primary'
                      )}
                    >
                      <Icon type={item.icon} className='mb-2 h-6 w-6' />
                      <span className='text-center text-xs font-medium'>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </nav>
  )
}
