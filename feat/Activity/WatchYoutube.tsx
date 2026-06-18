'use client'

import type { FC } from 'react'
import { cn } from '@/lib/utils'
import { useYoutubeSync } from '@/hooks'

export const WatchYoutube: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { hasControl, iframeContainerRef } = useYoutubeSync(onReady)

  return (
    <div className='absolute inset-0 bg-black'>
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          hasControl && 'inset-bs-11'
        )}
      >
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
