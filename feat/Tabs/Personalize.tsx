'use client'

import type { FC } from 'react'
import type { SwitchBackgroundProcessorOptions } from '@livekit/track-processors'
import { useRef, useState } from 'react'
import { Track } from 'livekit-client'
import { EmptyIcon } from '@phosphor-icons/react'
import { BackgroundProcessor, supportsBackgroundProcessors } from '@livekit/track-processors'
import { useLocalParticipant } from '@livekit/components-react'
import { Loading03FreeIcons } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { HugeIcon } from '@/components/HugeIcon'
import { Button } from '@/components/Button'

const BLUR_RADIUS = 15

interface VirtualBackgroundButton {
  title?: string
  icon?: React.ReactNode
  className?: string
  backgroundOptions: SwitchBackgroundProcessorOptions
}

const backgroundItems = [
  {
    title: 'Tidak ada',
    icon: <EmptyIcon size={20} className='text-neutral-400' />,
    className: 'bg-neutral-200',
    backgroundOptions: { mode: 'disabled' },
  },
  {
    title: 'Blur',
    icon: <div className='size-5 bg-gray-300 blur'></div>,
    backgroundOptions: { mode: 'background-blur', blurRadius: BLUR_RADIUS },
  },
  {
    className: 'bg-[url(/img/virtual-background-image1.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image1.jpg',
    },
  },
  {
    className: 'bg-[url(/img/virtual-background-image2.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image2.jpg',
    },
  },
  {
    className: 'bg-[url(/img/virtual-background-image3.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image3.jpg',
    },
  },
  {
    className: 'bg-[url(/img/virtual-background-image4.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image4.jpg',
    },
  },
  {
    className: 'bg-[url(/img/virtual-background-image5.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image5.jpg',
    },
  },
  {
    className: 'bg-[url(/img/virtual-background-image6.jpg)] bg-cover',
    backgroundOptions: {
      mode: 'virtual-background',
      imagePath: '/img/virtual-background-image6.jpg',
    },
  },
] satisfies VirtualBackgroundButton[]

export const TabsPersonalize: FC = () => {
  const { localParticipant } = useLocalParticipant()
  const state = useRef({
    isBackgroundProcessorEnabled: false,
    backgroundProcessor: BackgroundProcessor({ mode: 'disabled' }),
  })
  const [activeBackground, setActiveBackground] = useState(0)
  const [currentBackground, setCurrentBackground] = useState(0)
  const [loading, setLoading] = useState(false)

  const virtualBackgroundHandler = async (
    options: SwitchBackgroundProcessorOptions,
    id: number
  ) => {
    setLoading(true)
    try {
      const localVideoTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track

      if (!localVideoTrack) return

      if (state.current.isBackgroundProcessorEnabled) {
        await localVideoTrack.stopProcessor()
        state.current.isBackgroundProcessorEnabled = false
      }

      await state.current.backgroundProcessor.switchTo(options)
      state.current.isBackgroundProcessorEnabled = true
      await localVideoTrack.setProcessor(state.current.backgroundProcessor)
      setActiveBackground(id)
    } catch (error) {
      setCurrentBackground(activeBackground)
      alert(error instanceof Error ? error.message : JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  if (!supportsBackgroundProcessors() || !localParticipant.isCameraEnabled) {
    return (
      <div className='flex h-full items-center text-center text-sm'>
        {!localParticipant.isCameraEnabled
          ? 'Aktifkan kamera untuk menggunakan latar belakang virtual'
          : 'Perangkat ini tidak mendukung pemrosesan latar belakang virtual'}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-4'>
      {backgroundItems.map(({ title, icon, className, backgroundOptions }, index) => {
        const isCurrent = index === currentBackground
        return (
          <Button
            key={`virtualBackground${index}`}
            className={cn(
              'relative flex h-36.25 flex-col items-center justify-center rounded-md border border-neutral-400 text-sm not-disabled:cursor-pointer hover:shadow disabled:cursor-not-allowed',
              className
            )}
            onClick={() => {
              if (loading) return
              setCurrentBackground(index)
              virtualBackgroundHandler(backgroundOptions, index)
            }}
            disabled={isCurrent || loading}
          >
            {icon} {title}
            {isCurrent && loading && (
              <span className='absolute animate-spin'>
                <HugeIcon icon={Loading03FreeIcons} />
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
