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
  useLocalParticipant,
} from '@livekit/components-react'
import { useMediaControls } from '@/hooks'
import { ToggleTrack } from '@/components/ToggleTrack'
import { ReactionIcon } from '@/components/ReactionIcon'
import { HandRaisedIcon } from '@/components/HandRaised'
import { CameraControl } from '@/components/CameraControl'
import { ButtonIcon } from '@/components/Button'

export const RoomControl: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const {
    // audioEnabled,
    videoEnabled,
    shareScreenEnabled,
    // handleToggleAudio,
    handleToggleShareScreen,
  } = useMediaControls({
    defaults: { audioEnabled: false, videoEnabled: false },
    persistUserChoices: false,
    room,
  })
  const state = useConnectionState(room)
  const [activeState, setActiveState] = useState<'camera' | 'reaction' | ''>('')
  const isCameraActive = activeState === 'camera'
  const isReactionActive = activeState === 'reaction'
  const audioEnabled = localParticipant.isMicrophoneEnabled

  useEffect(() => {
    if (!videoEnabled) {
      setActiveState('')
    }
  }, [videoEnabled])

  // useEffect(() => {
  //   const storage = localStorage.getItem('lk-user-choices')
  //   if (storage) {
  //     try {
  //       const uchoices = JSON.parse(storage)
  //       if (typeof uchoices === 'object') {
  //         localStorage.setItem('lk-user-choices', JSON.stringify({ ...uchoices, audioEnabled }))
  //       }
  //     } catch (e) {
  //       console.log('Failed to parse storage:', e)
  //     }
  //   }
  // }, [audioEnabled])

  if (state === ConnectionState.Connecting) {
    return null
  }

  return (
    <div className='bg-background flex items-center justify-center gap-2 rounded-md border px-1 py-2 shadow *:not-[div]:size-10 md:*:not-[div]:size-12 xl:min-h-28 xl:gap-4 xl:px-5 xl:py-6'>
      <ToggleTrack
        title={audioEnabled ? 'Bisukan mikrofon' : 'Aktifkan mikrofon'}
        isActive={audioEnabled}
        className='size-10 md:size-12'
        onClick={async () => {
          const storage = localStorage.getItem('lk-user-choices')
          if (storage) {
            try {
              const uchoices = JSON.parse(storage)
              if (typeof uchoices === 'object') {
                localStorage.setItem(
                  'lk-user-choices',
                  JSON.stringify({
                    ...uchoices,
                    audioEnabled: !audioEnabled,
                  })
                )
              }
            } catch (e) {
              console.log('Failed to parse storage:', e)
            }
          }
          await localParticipant.setMicrophoneEnabled(!audioEnabled)
        }}
      >
        {audioEnabled ? <MicIcon /> : <MicDisabledIcon />}
      </ToggleTrack>
      <div className='dark:bg-primary/50 flex items-center gap-1 rounded-full bg-red-200 p-1'>
        <CameraControl
          isActive={isCameraActive}
          onClick={() => setActiveState((prev) => (!prev || prev !== 'camera' ? 'camera' : ''))}
          onToggle={(enable) => {
            if (!enable) {
              setActiveState('')
            }
          }}
        />
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
        onClick={() => room.disconnect()}
        className='text-error bg-red-200 hover:bg-red-200!'
      >
        <PhoneSlashIcon weight='fill' size={20} />
      </ButtonIcon>
    </div>
  )
}
