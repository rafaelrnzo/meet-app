'use client'

import type { ComponentProps, ComponentType, FC } from 'react'
import type { ScreenID } from '@/feat/Room/State'
import { useEffect, useState } from 'react'
import { default as dynamic } from 'next/dynamic'
import { RecordIcon } from '@phosphor-icons/react'
import { Chevron } from '@livekit/components-react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useRoomState } from '@/feat/Room/State'
import { ScreenCode } from '@/feat/enum'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/Loading'
import { HugeIcon } from '@/components/HugeIcon'

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

const Notes = dynamic(async () => (await import('@/feat/Activity/Notes')).Notes, {
  ssr: false,
  loading: () => <Loading />,
})

const Polling = dynamic(async () => (await import('@/feat/Activity/Polling')).Polling, {
  ssr: false,
  loading: () => <Loading />,
})

export interface RoomCanvasProps extends ComponentProps<'div'> {
  screenId: ScreenID
}

const config = {
  [ScreenCode.Whiteboard]: {
    comp: Whiteboard,
  },
  [ScreenCode.WatchYoutube]: {
    comp: WatchYoutube,
  },
  [ScreenCode.Presentation]: {
    comp: Presentation,
  },
  [ScreenCode.Notes]: {
    border: cn('border-yellow-400'),
    background: cn('bg-yellow-400'),
    comp: Notes,
  },
  [ScreenCode.Polling]: {
    border: cn('border-teal-500'),
    background: cn('bg-teal-500'),
    comp: Polling,
  },
}

const configDefault = { border: '', background: '', comp: () => null }

export const RoomCanvas: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  const { screen, record } = useRoomState()
  const screenConfig: {
    border?: string
    background?: string
    comp: ComponentType<{
      onReady?: () => void
    }>
  } = screen?.id ? config[screen.id] : configDefault
  const [isReady, setIsReady] = useState(false)
  const [open, setIsOpen] = useState(false)
  const { border, background, comp: Component } = screenConfig
  const borderColor = border || (record ? 'border-destructive' : 'border-transparent')
  const backgroundColor = background || (record ? 'bg-destructive' : 'bg-transparent')

  // Reset
  useEffect(() => {
    if (!screen?.id) {
      setIsReady(false)
      setIsOpen(false)
    }
  }, [screen?.id])

  return (
    <div {...props} className={cn('absolute inset-0 z-1 hidden has-[&>*>*]:block', className)}>
      {/* Content layer */}
      <div className='absolute inset-2 [&_.tl-watermark\\_SEE-LICENSE]:hidden!'>
        {screen && (
          <>
            <Loading
              className={cn(
                'absolute transition-opacity delay-300',
                isReady ? 'opacity-0' : 'opacity-100'
              )}
            />
            <div
              className={cn(
                // Base
                'pointer-events-auto absolute inset-0 transition-all transition-discrete',

                // Overflow handling
                'overflow-hidden',

                // Starting state (before it show)
                'starting:opacity-0',

                // State when open (with discrete)
                'opacity-100',

                // Logic visibility
                !open && 'hidden opacity-0',
                !isReady && 'hidden'
              )}
            >
              <Component
                onReady={() => {
                  setIsReady(true)
                  setIsOpen(true)
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Frame overlay */}
      <div
        className={cn('pointer-events-none absolute inset-0 z-10 rounded-md border-8', borderColor)}
      >
        {/* Top right corner */}
        <div
          className={cn(
            'pointer-events-auto absolute top-0 right-0 flex h-11 items-center gap-1 rounded-bl-md pl-2 *:-translate-y-0.75',
            backgroundColor
          )}
        >
          {record && (
            <div className='flex h-8 items-center gap-1 rounded-full bg-black/50 px-2 pr-3 text-sm font-semibold text-white last:mr-2'>
              <RecordIcon size={20} weight='fill' className='animate-pulse text-red-500' />
              REC
            </div>
          )}
          {screen ? (
            screen.id === ScreenCode.Presentation ||
            screen.id === ScreenCode.WatchYoutube ||
            screen.id === ScreenCode.Whiteboard ? (
              <Button
                className='-translate-x-5! translate-y-4!'
                variant='destructive-light'
                onClick={() => setIsOpen((previous) => !previous)}
              >
                {open ? <HugeIcon icon={ArrowRight01Icon} /> : <HugeIcon icon={ArrowLeft01Icon} />}
              </Button>
            ) : (
              <button
                className='inline-flex size-8 items-center justify-center rounded-full hover:bg-black/20'
                onClick={() => setIsOpen((previous) => !previous)}
              >
                <Chevron
                  className={cn(
                    '-translate-x-px scale-125 rotate-0 transition-all',
                    open && 'rotate-180'
                  )}
                />
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
