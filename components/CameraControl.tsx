'use client'

import type { FC } from 'react'
import { useEffect, useEffectEvent, useRef } from 'react'
import { CheckIcon } from '@phosphor-icons/react'
import { CameraIcon, CameraDisabledIcon } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { useCameraQuality } from '@/hooks'
import { CameraResolutionOptions } from '@/feat/const'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleTrack } from '@/components/ToggleTrack'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'

export interface CameraControlProps {
  isActive: boolean
  onClick?: () => void
  onToggle?: (isCameraEnabled: boolean) => void
}

export const CameraControl: FC<CameraControlProps> = ({ isActive, onClick, onToggle }) => {
  const { isCameraEnabled, resolution, maxResolution, changeResolution, toggleCamera } =
    useCameraQuality()
  const popoverRef = useRef<HTMLDivElement>(null)
  const onToggleEvent = useEffectEvent((enable: boolean) => onToggle?.(enable))

  useEffect(() => onToggleEvent(isCameraEnabled), [isCameraEnabled])

  return (
    <div className='relative inline-block' ref={popoverRef}>
      {isActive && (
        <div className='absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10'>
          <div className='px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase'>
            Camera Quality
          </div>
          <div className='mt-1 space-y-0.5'>
            {CameraResolutionOptions.map((option) => ({
              ...option,
              disabled: option.value > maxResolution,
            })).map(({ disabled, ...option }) => (
              <button
                key={option.value}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) changeResolution(option.value)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  disabled
                    ? 'cursor-not-allowed text-gray-400 opacity-40 dark:text-zinc-600'
                    : resolution.height === option.value
                      ? 'bg-gray-100 font-medium text-gray-900 dark:bg-zinc-800 dark:text-white'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>
                  {option.label}{' '}
                  {disabled && (
                    <span className='text-[10px] font-normal text-red-500'>(Tidak didukung)</span>
                  )}
                </span>
                {resolution.height === option.value && !disabled && (
                  <CheckIcon className='size-4 text-gray-900 dark:text-white' weight='bold' />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <ToggleTrack
          title={isCameraEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
          isActive={isCameraEnabled}
          onClick={toggleCamera}
          className='size-8 md:size-10'
        >
          {isCameraEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
        </ToggleTrack>
        <Tooltip>
          <TooltipTrigger className='cursor-pointer' asChild>
            <button
              disabled={!isCameraEnabled}
              inert={!isCameraEnabled}
              onClick={onClick}
              className={cn(
                'dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full transition-transform duration-200 hover:bg-red-300 md:size-10',
                isActive ? 'rotate-180' : '',
                !isCameraEnabled ? 'cursor-not-allowed opacity-40' : ''
              )}
            >
              <HugeIcon icon={ChevronUp} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent className='bg-red-800 text-sm'>
            Nyalakan kamera untuk mengatur kualitas kamera
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
