"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center h-screen flex-col gap-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground px-6 py-8 shadow-lg backdrop-blur">
        <div className="flex items-center justify-center mb-4">
          <span className="text-2xl font-semibold tracking-tight">meet app</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
