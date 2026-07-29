'use client'

import type { ComponentProps, FC } from 'react'
import { useEffect, useState } from 'react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useTabsMeeting } from '@/hooks'
import { useRoomState } from '@/feat/Room/State'
import { Button } from '@/components/ui/button'
import { HugeIcon } from '@/components/HugeIcon'

export interface CanvasWindowProps extends ComponentProps<'div'> {
  isActive?: boolean
}

export const CanvasWindow: FC<CanvasWindowProps> = ({
  children,
  className,
  isActive,
  ...props
}) => {
  const [open, setIsOpen] = useState(false)
  const { stopActiveScreen } = useRoomState()
  const { isHostScreen } = useTabsMeeting()

  // Sync with parent
  useEffect(() => setIsOpen(!!isActive), [isActive])

  return (
    <div
      {...props}
      inert={!isActive}
      className={cn('relative flex h-full w-full flex-col', className)}
    >
      <div className='border-foreground/10 bg-background relative flex w-full items-center justify-between border-b p-2'>
        <Button variant='destructive' onClick={() => stopActiveScreen()} disabled={!isHostScreen}>
          Berhenti
        </Button>
        <Button variant='destructive-light' onClick={() => setIsOpen((prev) => !prev)}>
          {open ? <HugeIcon icon={ArrowRight01Icon} /> : <HugeIcon icon={ArrowLeft01Icon} />}
        </Button>
      </div>

      <div inert={!open} className='relative h-full w-full overflow-hidden inert:hidden'>
        {children}
      </div>
    </div>
  )
}
