'use client'

import type { ComponentProps, CSSProperties, FC } from 'react'
import type { LayoutContextType } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
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
import { cn } from '@/lib/utils'
import { useParamsState, useConferenceRoom } from '@/hooks'
import { RoomToast, RoomPanel, RoomControl, RoomCanvas } from '@/feat/Room'
import { RoomTabs } from '@/feat/const'
import { HandRaiseDialog } from '@/components/HandRaised'

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
  const layoutContext = useCreateLayoutContext()
  const { tabsCode } = useParamsState()
  const currentTab = RoomTabs.find(({ id }) => tabsCode === id)
  const RoomPanelContent = currentTab?.content?.() ?? (() => null)

  return (
    <LayoutContextProvider value={layoutContext}>
      <HandRaiseDialog />
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
