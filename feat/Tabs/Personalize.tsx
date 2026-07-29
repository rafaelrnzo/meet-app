'use client'

import type { FC } from 'react'
import type { SwitchBackgroundProcessorOptions } from '@livekit/track-processors'
import { useRef, useState } from 'react'
import { Track } from 'livekit-client'
import { EmptyIcon } from '@phosphor-icons/react'
import { BackgroundProcessor } from '@livekit/track-processors'
import { useLocalParticipant } from '@livekit/components-react'
import { Loading03FreeIcons } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { useControls } from '@/hooks'
import { defaultErrorMessage } from '@/config'
import { toast } from '@/components/ui/sonner'
import { default as NoData } from '@/components/ui/no-data'
import { HugeIcon } from '@/components/HugeIcon'
import { Button } from '@/components/Button'

const BLUR_RADIUS = 15

interface VirtualBackgroundItem {
  title?: string
  icon?: React.ReactNode
  className?: string
  backgroundOptions: SwitchBackgroundProcessorOptions
}

const backgroundItems: VirtualBackgroundItem[] = [
  {
    title: 'Tidak ada',
    icon: <EmptyIcon size={20} className='text-neutral-400' />,
    className: 'bg-neutral-200',
    backgroundOptions: { mode: 'disabled' },
  },
  {
    title: 'Blur',
    icon: <div className='size-5 bg-gray-300 blur' />,
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
]

export const TabsPersonalize: FC = () => {
  const { localParticipant } = useLocalParticipant()
  const { videoEnabled, handleToggleVideo } = useControls()

  // Single source of truth: what's confirmed active vs. what's pending
  const [activeBackground, setActiveBackground] = useState(0)
  const [pendingBackground, setPendingBackground] = useState(-1)

  // Stable ref — never triggers re-renders, safe for async mutation
  const processorRef = useRef({
    instance: BackgroundProcessor({ mode: 'disabled' }),
    isAttached: false,
  })

  const isLoading = pendingBackground > -1

  const applyBackground = async (options: SwitchBackgroundProcessorOptions, index: number) => {
    if (isLoading || index === activeBackground) return

    setPendingBackground(index)
    try {
      const localVideoTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track

      if (!localVideoTrack) {
        toast.error('Kamera tidak ditemukan', {
          description: 'Pastikan kamera sudah aktif sebelum mengganti latar belakang.',
        })
        return
      }

      // Detach previous processor before switching
      if (processorRef.current.isAttached) {
        await localVideoTrack.stopProcessor()
        processorRef.current.isAttached = false
      }

      await processorRef.current.instance.switchTo(options)
      await localVideoTrack.setProcessor(processorRef.current.instance)
      processorRef.current.isAttached = true

      setActiveBackground(index)
      toast.success('Latar belakang berhasil diganti')
    } catch (error) {
      toast.error('Gagal mengubah latar belakang', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    } finally {
      setPendingBackground(-1)
    }
  }

  if (!videoEnabled) {
    return (
      <div className='flex h-full items-center text-center text-sm'>
        <NoData
          title={
            !videoEnabled
              ? 'Aktifkan Kamera Terlebih Dahulu'
              : 'Perangkat ini tidak mendukung pemrosesan latar belakang virtual'
          }
          desc={!videoEnabled ? 'Virtual background hanya dapat digunakan saat kamera aktif.' : ''}
          {...(!videoEnabled && {
            insertButton: {
              children: 'Aktifkan Kamera',
              onClick: handleToggleVideo,
            },
          })}
          className='[&>div]:min-w-[unset]'
        />
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-4'>
      {backgroundItems.map(({ title, icon, className, backgroundOptions }, index) => {
        const isActive = index === activeBackground
        const isPending = index === pendingBackground

        return (
          <Button
            key={`virtualBackground${index}`}
            className={cn(
              'relative flex h-36.25 flex-col items-center justify-center rounded-md border border-neutral-400 text-sm not-disabled:cursor-pointer hover:shadow disabled:cursor-not-allowed',
              className
            )}
            onClick={() => applyBackground(backgroundOptions, index)}
            disabled={isActive || isLoading}
          >
            {icon}
            {title}
            {isPending && (
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
