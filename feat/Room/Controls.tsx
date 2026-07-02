'use client'

import type { FC, ReactNode } from 'react'
import { ConnectionState } from 'livekit-client'
import { MonitorPlayIcon, PhoneSlashIcon, SmileyIcon } from '@phosphor-icons/react'
import {
  MicDisabledIcon,
  CameraDisabledIcon,
  MicIcon,
  CameraIcon,
  useRoomContext,
  useConnectionState,
} from '@livekit/components-react'
import { useMediaControls } from '@/hooks'
import { ToggleTrack } from '@/components/ToggleTrack'
import { HugeIcon, ChevronUp } from '@/components/HugeIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
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
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <ToggleTrack
          title={videoEnabled ? 'Tutup kamera' : 'Aktifkan kamera'}
          isActive={videoEnabled}
          onClick={handleToggleVideo}
          className='size-8 md:size-10'
        >
          {videoEnabled ? <CameraIcon /> : <CameraDisabledIcon />}
        </ToggleTrack>
        <button className='dark:hover:bg-primary/50 relative inline-flex size-8 items-center justify-center rounded-full hover:bg-red-300 md:size-10'>
          <HugeIcon icon={ChevronUp} strokeWidth={2} />
        </button>
      </div>
      <ButtonIcon isActive={shareScreenEnabled} onClick={handleToggleShareScreen}>
        <MonitorPlayIcon weight='fill' size={22} />
      </ButtonIcon>
      <ButtonIcon isActive>
        <SmileyIcon weight='fill' size={24} />
      </ButtonIcon>
      <HandRaisedIcon />
      {children}
      <ButtonIcon onClick={() => room.disconnect()}>
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}
