"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-svh grid lg:grid-cols-2 bg-background text-foreground">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Meet App
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground px-6 py-8 shadow-xl backdrop-blur">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <div className="absolute inset-0 from-muted via-background to-muted" />
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover opacity-30 dark:brightness-[0.4] dark:grayscale"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Meet, talk, and collaborate.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Secure video meetings powered by LiveKit. Login untuk mengelola
            room dan bergabung ke conference.
          </p>
        </div>
      </div>
    </div>
  )
}
