'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Moon, Sun } from 'lucide-react'
import { getUser, type StoredUser } from '@/lib/api/auth-client'
import { cn } from '@/lib/utils'
import { useAuth } from '../../hooks/use-auth'
import { MobileNav } from '@/components/ui/mobile-nav'

type Theme = 'dark' | 'light'
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else {
      document.documentElement.classList.add('dark')
      setTheme('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

import { sidebarItems } from '@/lib/menu-items'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </ThemeProvider>
  )
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, isAuthenticated, isAdmin, hasPermission, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  if (loading) {
    return (
      <div className='bg-background text-foreground flex min-h-screen items-center justify-center'>
        <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const username = user?.username || 'Unknown'
  const role = user?.role || (isAdmin ? 'admin' : 'user')

  return (
    <div className='bg-background text-foreground flex min-h-screen font-sans transition-colors duration-200'>
      <aside className='bg-card border-border fixed z-20 hidden h-full w-16 flex-col items-center border-r py-6 shadow-sm md:flex'>
        <div className='bg-primary text-primary-foreground mb-8 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm'>
          V
        </div>

        <div className='flex w-full flex-1 flex-col items-center gap-3 px-2'>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const disabled = item.permission ? !hasPermission(item.permission) : false

            if (disabled) {
              return (
                <button
                  key={item.id}
                  disabled
                  className='text-muted-foreground flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md opacity-30'
                  title={item.label}
                >
                  <Icon className='h-4 w-4' />
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group relative flex h-9 w-9 items-center justify-center rounded-md transition-all duration-200',
                  !isActive && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isActive && 'bg-primary/10 text-primary'
                )}
                title={item.label}
              >
                <Icon className='h-4 w-4' />
              </Link>
            )
          })}
        </div>

        <div className='mb-2 flex flex-col gap-3'>
          <button
            onClick={toggleTheme}
            className='text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-md transition-all'
            title='Toggle Theme'
          >
            {theme === 'light' ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
          </button>

          <button
            onClick={logout}
            className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-9 w-9 items-center justify-center rounded-md transition-all'
            title='Logout'
          >
            <LogOut className='h-4 w-4' />
          </button>
        </div>
      </aside>

      <main className='ml-0 flex min-w-0 flex-1 flex-col pb-16 md:ml-16 md:pb-0'>
        <header className='bg-background/80 border-border sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6 backdrop-blur-md'>
          <div>
            <h1 className='text-sm font-semibold capitalize'>
              {sidebarItems.find((i) => i.href === pathname)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-3'>
              <span className='bg-muted border-border text-muted-foreground rounded border px-2 py-0.5 text-xs font-medium uppercase'>
                {typeof role === 'object' ? role.name : role}
              </span>
              <div className='bg-primary text-primary-foreground ring-background flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2'>
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-6'>
          <div className='animate-in fade-in mx-auto max-w-7xl duration-500'>{children}</div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
