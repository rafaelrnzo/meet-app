'use client'

import type { FC } from 'react'
import { usePresentation } from '@/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft01Icon, ArrowRight01Icon, HugeIcon, Minus, Plus } from '@/components/HugeIcon'

export const Presentation: FC<{
  onReady?: () => void
}> = ({ onReady }) => {
  const { canvasElementRef, canControl, pagination, zoomTrack } = usePresentation(onReady)
  const { pageNext, pagePrev, currentPage, maxPages } = pagination
  const { zoomIn, zoomOut, currentZoom, startHoldZoom, stopHoldZoom } = zoomTrack
  const zoomPercentage = Math.round(currentZoom * 100)

  return (
    <div className='absolute inset-0 rounded-md bg-[#3c3c3c]'>
      <div className='h-[68px] w-full rounded-md border border-neutral-200 bg-white px-5 py-3 text-slate-950 shadow-sm'>
        <div className='flex w-[55%] justify-between'>
          {canControl ? (
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center justify-between gap-2'>
                <Button disabled={currentPage === 1} onClick={pagePrev} variant='primary'>
                  <HugeIcon icon={ArrowLeft01Icon} />
                </Button>
                <Button disabled={currentPage === maxPages} onClick={pageNext} variant='primary'>
                  <HugeIcon icon={ArrowRight01Icon} />
                </Button>
              </div>
              <span>{`${currentPage}/${maxPages}`}</span>
            </div>
          ) : (
            <span className='flex items-center'>{`${currentPage}/${maxPages}`}</span>
          )}
          <div className='flex items-center justify-between gap-4'>
            <Button
              variant='destructive-light'
              onClick={zoomOut}
              onMouseDown={() => startHoldZoom(zoomOut)}
              onTouchStart={() => startHoldZoom(zoomOut)} // mobile
              onMouseUp={stopHoldZoom}
              onMouseLeave={stopHoldZoom} // jika kursor keluar dari tombol saat menahan
              onTouchEnd={stopHoldZoom}
              disabled={zoomPercentage === 50}
            >
              <HugeIcon icon={Minus} />
            </Button>
            <span>{zoomPercentage}%</span>
            <Button
              variant='destructive-light'
              onClick={zoomIn}
              onMouseDown={() => startHoldZoom(zoomIn)}
              onTouchStart={() => startHoldZoom(zoomIn)} // mobile
              onMouseUp={stopHoldZoom}
              onMouseLeave={stopHoldZoom} // jika kursor keluar dari tombol saat menahan
              onTouchEnd={stopHoldZoom}
              disabled={zoomPercentage === 100}
            >
              <HugeIcon icon={Plus} />
            </Button>
          </div>
        </div>
      </div>
      {/* INFO: 68px from height of header control */}
      <div className='flex h-[calc(100%-68px)] w-full overflow-auto'>
        <div className='m-auto flex items-center justify-center p-5'>
          <canvas ref={canvasElementRef} />
        </div>
      </div>
    </div>
  )
}
