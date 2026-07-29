'use client'

import type { ComponentProps, FC } from 'react'
import { default as dynamic } from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useRoomState } from '@/feat/Room/State'
import { CanvasWindow } from '@/feat/Room/CanvasWindow'
import { ScreenCode } from '@/feat/enum'
import { Loading } from '@/components/Loading'

const Whiteboard = dynamic(async () => (await import('@/feat/Activity/Whiteboard')).Whiteboard, {
  ssr: false,
  loading: () => <Loading />,
})

const WatchYoutube = dynamic(
  async () => (await import('@/feat/Activity/WatchYoutube')).WatchYoutube,
  {
    ssr: false,
    loading: () => <Loading />,
  }
)

const Presentation = dynamic(
  async () => (await import('@/feat/Activity/Presentation')).Presentation,
  {
    ssr: false,
    loading: () => <Loading />,
  }
)

const Polling = dynamic(async () => (await import('@/feat/Activity/Polling')).Polling, {
  ssr: false,
  loading: () => <Loading />,
})

const config = {
  [ScreenCode.WatchYoutube]: WatchYoutube,
  [ScreenCode.Presentation]: Presentation,
  [ScreenCode.Polling]: Polling,
}

export const RoomCanvas: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const { screen } = useRoomState()
  const Component = screen && screen.id in config ? config[screen.id as never] : () => null

  return (
    <div
      {...props}
      inert={!screen}
      className={cn('absolute inset-0 z-1', !screen && 'hidden', className)}
    >
      <CanvasWindow isActive={!!screen}>
        {screen && screen.id !== ScreenCode.Whiteboard && <Component />}
        <Whiteboard hide={screen?.id !== ScreenCode.Whiteboard} />
      </CanvasWindow>
    </div>
  )
}
