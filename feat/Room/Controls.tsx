'use client'
import type { FC, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ConnectionState } from 'livekit-client'
import { MonitorPlayIcon, PhoneSlashIcon } from '@phosphor-icons/react'
import {
  MicDisabledIcon,
  MicIcon,
  useRoomContext,
  useConnectionState,
  CameraIcon,
  CameraDisabledIcon,
} from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { useMediaControls } from '@/hooks'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleTrack } from '@/components/ToggleTrack'
import { ReactionIcon } from '@/components/ReactionIcon'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
import { CameraControl } from '@/components/CameraControl'
import { ButtonIcon } from '@/components/Button'

export const RoomControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useRoomContext()
  const {
    audioEnabled,
    videoEnabled,
    shareScreenEnabled,
    handleToggleAudio,
    handleToggleVideo,
    handleToggleShareScreen,
  } = useMediaControls({ room })
  const state = useConnectionState(room)
  const [activeState, setActiveState] = useState<'camera' | 'reaction' | ''>('')
  const isCameraActive = activeState === 'camera'
  const isReactionActive = activeState === 'reaction'

  useEffect(
    () => setActiveState((prev) => (!videoEnabled && prev === 'camera' ? '' : prev)),
    [videoEnabled]
  )

  if (state === ConnectionState.Connecting) {
    return null
  }

  return (
    <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
      <ToggleTrack
        title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
        isActive={audioEnabled}
        onClick={handleToggleAudio}
        className='size-10 md:size-12'
      >
        {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
      </ToggleTrack>

      <CameraControl isActive={isCameraActive} isVideoEnabled={videoEnabled}>
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
              disabled={!videoEnabled}
              inert={!videoEnabled}
              onClick={() => {
                setActiveState((prev) => (!prev || prev !== 'camera' ? 'camera' : ''))
              }}
              className={cn(
                'dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full transition-transform duration-200 hover:bg-red-300 md:size-10',
                isCameraActive ? 'rotate-180' : '',
                !videoEnabled ? 'cursor-not-allowed opacity-40' : ''
              )}
            >
              <HugeIcon icon={ChevronUp} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent className='bg-red-800 text-sm'>
            Nyalakan kamera untuk mengatur kualitas kamera
          </TooltipContent>
        </Tooltip>
      </CameraControl>

      <ButtonIcon isActive={!shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon>
      <ReactionIcon
        isOpen={isReactionActive}
        onClick={() => setActiveState((prev) => (prev === 'reaction' ? '' : 'reaction'))}
      />
      <HandRaisedIcon />
      {children}
      <ButtonIcon
        onClick={() => room.disconnect()}
        className='text-error bg-red-200 hover:bg-red-200!'
      >
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}
