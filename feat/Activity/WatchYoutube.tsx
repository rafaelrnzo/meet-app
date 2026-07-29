'use client'

import type { FC } from 'react'
import { cn } from '@/lib/utils'
import { useYoutubeSync } from '@/hooks'

export const WatchYoutube: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { hasControl, iframeContainerRef } = useYoutubeSync(onReady)

  return (
    <div className='h-full w-full bg-black'>
      <div
        ref={iframeContainerRef}
        tabIndex={hasControl ? void 0 : -1}
        className={cn('aspect-video h-full w-full', !hasControl && 'pointer-events-none')}
      />
    </div>
  )
}
