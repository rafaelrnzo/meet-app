"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Video,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  PlayCircle,
  Briefcase,
  Shield,
} from "lucide-react"
import { getUser } from "@/lib/api/auth-client"
import { cn } from "@/lib/utils"
import { useAuth } from "../../hooks/use-auth"

// --- THEME CONTEXT ---
type Theme = "dark" | "light"
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      document.documentElement.classList.add("dark")
      setTheme("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("app-theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}

// --- SIDEBAR DATA ---
const sidebarItems = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "rooms", href: "/rooms", icon: Video, label: "Rooms" },
  { id: "groups", href: "/groups", icon: Briefcase, label: "Groups" },
  { id: "users", href: "/admin/users", icon: Users, label: "Users" },
  { id: "roles", href: "/admin/roles", icon: Shield, label: "Roles" },
  { id: "recordings", href: "/recordings", icon: PlayCircle, label: "Recordings" },
  { id: "settings", href: "/settings", icon: Settings, label: "Settings" },
]

type StoredUser = { username?: string; role?: string }

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Optional: Redirect to login if not handled by middleware/useAuth
    return null
  }

  const username = user?.username || "Unknown"
  const role = user?.role || (isAdmin ? "admin" : "user")

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-200">
      {/* SIDEBAR */}
      <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-6 fixed h-full z-20 shadow-sm">
        {/* Logo */}
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm mb-8">
          V
        </div>

        <div className="flex-1 flex flex-col items-center gap-3 w-full px-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            // Simple active check: strictly equal or starts with for subroutes
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            // Permission Check
            let isVisible = true

            // Logic:
            // Home, Settings -> Always visible (or authenticated)
            // Rooms -> rooms:read
            // Groups -> groups:read
            // Users -> users:read
            // Roles -> roles:manage
            // Recordings -> recordings:read

            if (item.id === "rooms" && !hasPermission("rooms", "read")) isVisible = false
            if (item.id === "groups" && !hasPermission("groups", "read")) isVisible = false
            if (item.id === "users" && !hasPermission("users", "read")) isVisible = false
            if (item.id === "roles" && !hasPermission("roles", "manage")) isVisible = false
            if (item.id === "recordings" && !hasPermission("recordings", "read")) isVisible = false

            if (!isVisible) return null

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-all duration-200 group relative",
                  !isActive && "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary"
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 mb-2">
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-all"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            onClick={logout}
            className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col ml-16 min-w-0">
        <header className="h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold capitalize">
              {sidebarItems.find(i => i.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2 py-0.5 bg-muted border border-border rounded uppercase text-muted-foreground">
                {role}
              </span>
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-background">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
