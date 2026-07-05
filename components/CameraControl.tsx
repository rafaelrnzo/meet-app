'use client'

import type { FC, ReactNode } from 'react'
import { useRef } from 'react'
import { CheckIcon } from '@phosphor-icons/react'
import { useCameraQuality } from '@/hooks'
import { CameraResolutionOptions } from '@/feat/const'

export interface CameraControlProps {
  isActive: boolean
  isVideoEnabled?: boolean
  children?: ReactNode
}

export const CameraControl: FC<CameraControlProps> = ({ isVideoEnabled, isActive, children }) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const { selectedQuality, changeResolution, isOptionDisabled } = useCameraQuality({
    isVideoEnabled,
    isOpen: isActive,
  })

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
              disabled: isOptionDisabled(option.value),
            })).map(({ disabled, ...option }) => (
              <button
                key={option.value}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) changeResolution(option.value, option)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  disabled
                    ? 'cursor-not-allowed text-gray-400 opacity-40 dark:text-zinc-600'
                    : selectedQuality === option.value
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
                {selectedQuality === option.value && !disabled && (
                  <CheckIcon className='size-4 text-gray-900 dark:text-white' weight='bold' />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        {children}
      </div>
    </div>
  )
}
