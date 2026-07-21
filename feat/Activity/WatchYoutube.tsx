'use client'

import type { FC } from 'react'
import { cn } from '@/lib/utils'
import { useTabsYoutube, useYoutubeSync } from '@/hooks'
import { Button } from '@/components/ui/button'

export const WatchYoutube: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { hasControl, iframeContainerRef } = useYoutubeSync(onReady)
  const { preventUpdate, match, isStartSharingRef, setIsPlayed } = useTabsYoutube()

  return (
    <div className='absolute inset-0 bg-black'>
      <div className='flex w-full items-center border border-neutral-200 bg-white px-5 py-3'>
        <Button
          variant='destructive'
          onClick={() => {
            isStartSharingRef.current = true
            setIsPlayed((prev) => !prev)
          }}
          disabled={preventUpdate || !match}
        >
          Berhenti
        </Button>
      </div>
      <div className={cn('absolute inset-0 inset-bs-11 my-10 flex items-center justify-center')}>
        <div
          ref={iframeContainerRef}
          tabIndex={hasControl ? void 0 : -1}
          className={cn(
            'aspect-video h-full max-h-full w-auto max-w-full',
            !hasControl && 'pointer-events-none'
          )}
        />
      </div>
    </div>
  )
}
