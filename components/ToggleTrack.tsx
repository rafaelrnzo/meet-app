'use client'

import type { ComponentProps } from 'react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ToggleTrackProps extends ComponentProps<'button'> {
  isActive?: boolean
  wrapperProps?: ComponentProps<'div'>
}

export const ToggleTrack = ({ isActive, wrapperProps, ...props }: ToggleTrackProps) => {
  const [mounted, setMounted] = useState(false)

  // Required for hydration
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <div {...wrapperProps}>
      <button
        type='button'
        {...props}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full',
          isActive
            ? 'text-primary border-muted-foreground border bg-white hover:not-disabled:bg-zinc-100'
            : 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900',

          props.className
        )}
      />
    </div>
  ) : null
}
