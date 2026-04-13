'use client'

import { GalleryVerticalEnd } from 'lucide-react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className='flex h-screen flex-col items-center justify-center gap-4'>
      <div className='border-border bg-card text-card-foreground w-full max-w-sm rounded-2xl border px-6 py-8 shadow-lg backdrop-blur'>
        <div className='mb-4 flex items-center justify-center'>
          <span className='text-2xl font-semibold tracking-tight'>meet app</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
