'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { authService } from '@/src/services/auth'
import { FieldGroup } from '@/components/ui/field'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    authService.login()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Login to Meet</h1>
          <p className='text-muted-foreground text-sm'>
            Sign in with your organization account to access video conferences.
          </p>
        </div>

        <div className='mt-4'>
          <Button onClick={handleLogin} className='w-full' size='lg'>
            Sign In with SSO (Keycloak)
          </Button>
        </div>
      </FieldGroup>
    </div>
  )
}
