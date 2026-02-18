"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { sidebarItems } from "@/lib/menu-items"
import { Menu } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"

export function MobileNav() {
    const pathname = usePathname()
    const { hasPermission } = useAuth()

    // Filter items based on permission
    const visibleItems = sidebarItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    )

    if (visibleItems.length === 0) return null

    const mainItems = visibleItems.slice(0, 4)
    const moreItems = visibleItems.slice(4)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t border-border md:hidden block pb-safe">
            <div className="flex items-center justify-around h-full px-2">
                {mainItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {moreItems.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors">
                                <Menu className="h-5 w-5" />
                                <span className="text-[10px] font-medium">More</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="w-[90%] rounded-xl">
                            <DialogHeader>
                                <DialogTitle>Menu</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-4 py-4">
                                {moreItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                                                isActive && "border-primary/50 bg-primary/5 text-primary"
                                            )}
                                        >
                                            <Icon className="h-6 w-6 mb-2" />
                                            <span className="text-xs font-medium text-center">{item.label}</span>
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
