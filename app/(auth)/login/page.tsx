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
    // <div className="min-h-svh grid lg:grid-cols- bg-background text-foreground">
    //   <div className="flex flex-col gap-6 p-6 md:p-10">
    //     <div className="flex justify-center gap-2 md:justify-start">
    //       <div className="flex items-center gap-2 font-medium">
    //         <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
    //           <GalleryVerticalEnd className="size-4" />
    //         </div>
    //         <span className="text-lg font-semibold tracking-tight">
    //           Meet App
    //         </span>
    //       </div>
    //     </div>

    //     <div className="flex flex-1 items-center justify-center">
    //       <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-card-foreground px-6 py-8 shadow-xl backdrop-blur">
    //         <LoginForm />
    //       </div>
    //     </div>
    //   </div>
    // </div>
  )
}
