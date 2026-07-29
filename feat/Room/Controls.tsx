'use client'

import type { FC, ReactNode } from 'react'
import { CheckIcon, PhoneSlashIcon, MonitorPlayIcon } from '@phosphor-icons/react'
import { CameraIcon, CameraDisabledIcon, MicDisabledIcon, MicIcon } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { useControls, useParamsState } from '@/hooks'
import { SearchParamsKey } from '@/feat/enum'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleTrack } from '@/components/ToggleTrack'
import { ReactionIcon } from '@/components/ReactionIcon'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
import { ButtonIcon } from '@/components/Button'

export const RoomControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const { router, searchParams } = useParamsState()
  const {
    isConnecting,
    audioEnabled,
    videoEnabled,
    chevronEnabled,
    shareScreenEnabled,
    resolution,
    resolutionOptions,
    isCameraActive,
    isReactionActive,
    handleResolutionChange,
    handleToggleShareScreen,
    handleToggleAudio,
    handleToggleVideo,
    setActiveState,
  } = useControls()

  if (isConnecting) {
    return null
  }

  return (
    <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
      <ToggleTrack
        title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
        isActive={audioEnabled}
        className='size-10 md:size-12'
        onClick={handleToggleAudio}
      >
        {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
      </ToggleTrack>
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <div className='relative inline-block'>
          {isCameraActive && (
            <div className='absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10'>
              <div className='px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase'>
                Camera Quality
              </div>
              <div className='mt-1 space-y-0.5'>
                {resolutionOptions.map(({ disabled, ...option }) => (
                  <button
                    key={option.value}
                    disabled={disabled}
                    onClick={() => handleResolutionChange(option.value)}
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
                        <span className='text-[10px] font-normal text-red-500'>
                          (Tidak didukung)
                        </span>
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
              title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
              isActive={videoEnabled}
              onClick={handleToggleVideo}
              className='size-8 md:size-10'
            >
              {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
            </ToggleTrack>
            <Tooltip>
              <TooltipTrigger className='cursor-pointer' asChild>
                <button
                  disabled={!chevronEnabled}
                  inert={!chevronEnabled}
                  onClick={() =>
                    setActiveState((prev) => (!prev || prev !== 'camera' ? 'camera' : ''))
                  }
                  className={cn(
                    'dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full transition-transform duration-200 hover:bg-red-300 md:size-10',
                    isCameraActive ? 'rotate-180' : '',
                    !chevronEnabled ? 'cursor-not-allowed opacity-40' : ''
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
      </div>
      <ButtonIcon isActive={!shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon>
      <ReactionIcon
        isOpen={isReactionActive}
        onClick={() => setActiveState((prev) => (!prev || prev !== 'reaction' ? 'reaction' : ''))}
      />
      <HandRaisedIcon />
      {children}
      <ButtonIcon
        className='text-error bg-red-200 hover:bg-red-200!'
        onClick={() => router.replace(`/${searchParams.get(SearchParamsKey.FromCode) ?? ''}`)}
      >
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}
