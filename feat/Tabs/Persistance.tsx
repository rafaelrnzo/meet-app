'use client'

import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Similar react Activities without mutating the children
export const TabsPersistence: FC<{ visible?: boolean; children?: ReactNode }> = ({
  children,
  visible = false,
}) => {
  return (
    <div inert={!visible} className={cn('absolute inset-0', visible ? '' : 'hidden')}>
      {children}
    </div>
  )
}
