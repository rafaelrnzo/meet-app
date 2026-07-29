'use client'

import type { FC } from 'react'
import { usePresentation } from '@/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft01Icon, ArrowRight01Icon, HugeIcon, Minus, Plus } from '@/components/HugeIcon'

export const Presentation: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const {
    canvasElementRef,
    canControl,
    page,
    maxPages,
    zoom,
    pagePrev,
    pageNext,
    zoomIn,
    zoomOut,
  } = usePresentation(onReady)
  const zoomPercentage = Math.round(zoom * 100)

  return (
    <div className='flex h-full w-full flex-col bg-[#3c3c3c]'>
      <div className='flex flex-wrap justify-between gap-2 p-2'>
        {canControl ? (
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center justify-between gap-2'>
              <Button disabled={page === 1} onClick={pagePrev} variant='primary'>
                <HugeIcon icon={ArrowLeft01Icon} />
              </Button>
              <Button disabled={page === maxPages} onClick={pageNext} variant='primary'>
                <HugeIcon icon={ArrowRight01Icon} />
              </Button>
            </div>
            <span>{`${page}/${maxPages}`}</span>
          </div>
        ) : (
          <span className='flex items-center'>{`${page}/${maxPages}`}</span>
        )}
        <div className='flex items-center justify-between gap-4'>
          <Button variant='destructive-light' onClick={zoomOut} disabled={zoomPercentage === 50}>
            <HugeIcon icon={Minus} />
          </Button>
          <span>{zoomPercentage}%</span>
          <Button variant='destructive-light' onClick={zoomIn} disabled={zoomPercentage === 150}>
            <HugeIcon icon={Plus} />
          </Button>
        </div>
      </div>
      {/* INFO: 68px from height of header control */}
      <div className='flex h-full w-full overflow-auto'>
        <div className='m-auto flex items-center justify-center p-5'>
          <canvas ref={canvasElementRef} />
        </div>
      </div>
    </div>
  )
}
