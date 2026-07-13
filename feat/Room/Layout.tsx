'use client'

import type { ComponentProps, CSSProperties, FC } from 'react'
import type { LayoutContextType } from '@livekit/components-react'
import { useEffect, useRef } from 'react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import {
  useCreateLayoutContext,
  LayoutContextProvider,
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react'
import { cn, decoder } from '@/lib/utils'
import { useParamsState, useConferenceRoom, useDataChannel } from '@/hooks'
import { RoomToast, RoomPanel, RoomControl, RoomCanvas } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'
import { RoomTabs } from '@/feat/const'
import { toast } from '@/components/ui/sonner'
import { HandRaiseToast } from '@/components/HandRaised'

export const RoomGrid: FC<{ context: LayoutContextType }> = ({ context: layoutContext }) => {
  const { tracks, focusTrack, carouselTracks } = useConferenceRoom({ layoutContext })

  return (
    <div className='absolute inset-0 *:h-full *:w-full'>
      {!focusTrack ? (
        <div className='lk-grid-layout-wrapper'>
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
        </div>
      ) : (
        <div className='lk-focus-layout-wrapper'>
          <FocusLayoutContainer>
            {carouselTracks.length ? (
              <CarouselLayout tracks={carouselTracks}>
                <ParticipantTile />
              </CarouselLayout>
            ) : (
              <div className='lk-carousel text-muted-foreground bg-secondary flex items-center justify-center rounded-md border p-5 text-center text-sm'>
                Kamu sendirian <br /> diruangan ini.
              </div>
            )}
            {focusTrack && <FocusLayout trackRef={focusTrack} />}
          </FocusLayoutContainer>
        </div>
      )}
    </div>
  )
}

export const RoomBoard: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const { isPanelActive } = useParamsState()
  const room = useRoomContext()
  const state = useConnectionState(room)

  return (
    <div
      {...props}
      className={cn(
        '*:bg-background relative grid grow grid-cols-1 gap-3',
        isPanelActive && state !== ConnectionState.Connecting && 'xl:grid-cols-[1fr_25rem]',
        className
      )}
    />
  )
}

export const RoomLayout: FC<ComponentProps<'main'>> = ({ className, children, ...props }) => {
  const { tabsCode } = useParamsState()
  const room = useRoomContext()
  const layoutContext = useCreateLayoutContext()
  const currentTab = RoomTabs.find(({ id }) => tabsCode === id)
  const RoomPanelContent = currentTab?.content?.() ?? (() => null)
  const toastIdRef = useRef<string | number>(0)

  useDataChannel<{ enabled: boolean }>(LiveKitAction.AllMicrophoneUpdate, ({ payload }) => {
    if (payload?.enabled) return null

    room.localParticipant.setMicrophoneEnabled(false)
  })

  useDataChannel<{ enabled: boolean }>(LiveKitAction.MicrophoneUpdate, ({ payload }) => {
    if (payload?.enabled) return null

    room.localParticipant.setMicrophoneEnabled(false)
  })

  useDataChannel<{ disconnect: boolean }>(LiveKitAction.DisconnectRoom, async ({ payload }) => {
    if (!payload?.disconnect) return
    room.localParticipant.setMicrophoneEnabled(false)
    room.localParticipant.setCameraEnabled(false)
    room.disconnect()
    alert('Host telah mengeluarkan Anda dari ruangan ini.')
  })

  useDataChannel<{ ban: boolean }>(LiveKitAction.ModerateRoom, async ({ payload }) => {
    if (!payload?.ban) return
    alert('Host telah memblokir Anda dari ruangan ini.')
  })

  useEffect(() => {
    const handlePickedUser = (data: Uint8Array) => {
      try {
        const rawString = decoder.decode(data)

        // Invalid json parse
        if (!rawString.trim().startsWith('{')) {
          return
        }

        const { action } = JSON.parse(decoder.decode(data)) as {
          action: LiveKitAction
          payload: string
        }

        if (action === LiveKitAction.PickUser) {
          toastIdRef.current = toast.pick('Anda telah ditunjuk', {
            position: 'top-center',
            duration: Infinity,
          })
        }

        if (action === LiveKitAction.PickUserReset) {
          toast.dismiss()
        }
      } catch (e) {
        console.log('Failed to receive the message:', e)
      }
    }

    room.on(RoomEvent.DataReceived, handlePickedUser)
    return () => {
      room.off(RoomEvent.DataReceived, handlePickedUser)

      // Clean persistent toast
      toast.dismiss(toastIdRef.current)
    }
  }, [room])

  return (
    <LayoutContextProvider value={layoutContext}>
      <HandRaiseToast />
      <RoomAudioRenderer />
      <main {...props} className={cn('bg-secondary/40 fixed inset-0 p-3', className)}>
        <div className='flex h-full flex-col gap-3'>
          <RoomBoard>
            <div
              className='relative flex items-center justify-center rounded-md border shadow'
              data-lk-theme='default'
              style={{ '--lk-control-bar-height': '0px' } as CSSProperties}
            >
              <RoomCanvas />
              <RoomGrid context={layoutContext} />
              <RoomToast />
            </div>
            <RoomPanel className='xl:bottom-34'>
              <RoomPanelContent />
            </RoomPanel>
          </RoomBoard>
          <RoomControl />
          {children}
        </div>
      </main>
    </LayoutContextProvider>
  )
}
