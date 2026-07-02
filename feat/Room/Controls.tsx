'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { ConnectionState } from 'livekit-client'
import { MonitorPlayIcon, PhoneSlashIcon } from '@phosphor-icons/react'
import {
  MicDisabledIcon,
  MicIcon,
  useRoomContext,
  useConnectionState,
} from '@livekit/components-react'
import { useParamsState, useMediaControls } from '@/hooks'
import { ToggleTrack } from '@/components/ToggleTrack'
import { ReactionIcon } from '@/components/ReactionIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
import { default as CameraControl } from '@/components/CameraControl'
import { ButtonIcon } from '@/components/Button'

export const RoomControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useRoomContext()
  const { router } = useParamsState()
  const { audioEnabled, shareScreenEnabled, handleToggleAudio, handleToggleShareScreen } =
    useMediaControls({ room })
  const state = useConnectionState(room)
  const [isReactionUp, setReactionUp] = useState(false)
  const [isCameraUp, setCameraUp] = useState(false)

  if (state === ConnectionState.Connecting) {
    return null
  }

  const handleReactionUp = () => {
    setReactionUp((prev) => !prev)
    setCameraUp(false)
  }

  const handleCameraUp = () => {
    setCameraUp((prev) => !prev)
    setReactionUp(false)
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
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <CameraControl isOpen={isCameraUp} onToggle={handleCameraUp} setOpen={setCameraUp} />
      </div>
      <ButtonIcon isActive={!shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon>
      <ReactionIcon isOpen={isReactionUp} onToggle={handleReactionUp} />
      <HandRaisedIcon />
      {children}
      <ButtonIcon
        onClick={() => router.replace('/')}
        className='text-error bg-red-200 hover:bg-red-200!'
      >
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}
