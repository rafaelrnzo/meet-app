'use client'

import type { FC } from 'react'
import { usePresentation } from '@/hooks'

export const Presentation: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { canvasElementRef, canControl, pageNext, pagePrev } = usePresentation(onReady)

  return (
    <div className='absolute inset-0 bg-[#3c3c3c]'>
      <canvas ref={canvasElementRef} className='h-full w-full object-contain' />
      {canControl && (
        <div className='absolute right-4 bottom-4 flex gap-2'>
          <button onClick={pagePrev}>Prev</button>
          <button onClick={pageNext}>Next</button>
        </div>
      )}
    </div>
  )
}
