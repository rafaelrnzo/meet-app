'use client'

import { useState, useEffect, useRef } from 'react'
import { Track } from 'livekit-client'
import { useLocalParticipant } from '@livekit/components-react'
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors'
import { Image as ImageIcon, Sparkles, Upload, Ban } from 'lucide-react'

type BackgroundOption = 'none' | 'blur' | 'image-1' | 'image-2' | 'image-3' | 'custom'

export function VirtualBackgroundSelector({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { localParticipant } = useLocalParticipant()
  const [activeBackground, setActiveBackground] = useState<BackgroundOption>('none')
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Ref to hold the current processor
  const processorRef = useRef<any>(null)

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('virtual-background-pref') as BackgroundOption
    const savedCustom = localStorage.getItem('virtual-background-custom')
    if (saved) {
      if (saved === 'custom' && savedCustom) {
        setCustomImage(savedCustom)
        setActiveBackground('custom')
      } else {
        setActiveBackground(saved)
      }
    }
  }, [])

  // Effect to apply background when activeBackground changes
  useEffect(() => {
    if (!localParticipant) return

    const applyBackground = async () => {
      const trackPublication = localParticipant.getTrackPublication(Track.Source.Camera)
      if (!trackPublication || !trackPublication.videoTrack) return

      const videoTrack = trackPublication.videoTrack
      setProcessing(true)

      try {
        if (processorRef.current) {
          await videoTrack.setProcessor(processorRef.current)
          if (processorRef.current.destroy) {
            await processorRef.current.destroy()
          }
          processorRef.current = null
        }

        if (activeBackground === 'blur') {
          const blur = BackgroundBlur(10, { delegate: 'GPU' })
          await videoTrack.setProcessor(blur)
          processorRef.current = blur
        } else if (activeBackground.startsWith('image') || activeBackground === 'custom') {
          let imageUrl = ''
          if (activeBackground === 'image-1') imageUrl = '/bedroom.jpg'
          if (activeBackground === 'image-2') imageUrl = '/cafe.jpg'
          if (activeBackground === 'image-3') imageUrl = '/office.jpeg'
          if (activeBackground === 'custom' && customImage) imageUrl = customImage

          if (imageUrl) {
            const vb = VirtualBackground(imageUrl, { delegate: 'GPU' })
            await videoTrack.setProcessor(vb)
            processorRef.current = vb
          }
        }

        // Save preference
        localStorage.setItem('virtual-background-pref', activeBackground)
        if (activeBackground === 'custom' && customImage) {
          localStorage.setItem('virtual-background-custom', customImage)
        }
      } catch (error) {
        console.error('Failed to apply virtual background:', error)
      } finally {
        setProcessing(false)
      }
    }

    // Debounce slightly to prevent rapid switching issues
    const timeout = setTimeout(applyBackground, 100)
    return () => clearTimeout(timeout)
  }, [activeBackground, customImage, localParticipant])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCustomImage(result)
        setActiveBackground('custom')
      }
      reader.readAsDataURL(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className='bg-card border-border absolute bottom-4 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 rounded-xl border p-4 shadow-2xl'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>Virtual Background</h3>
        <button onClick={onClose} className='text-muted-foreground hover:text-foreground text-xs'>
          Close
        </button>
      </div>

      <div className='grid grid-cols-4 gap-2'>
        {/* NONE */}
        <button
          onClick={() => setActiveBackground('none')}
          className={`flex aspect-video flex-col items-center justify-center rounded-lg border-2 transition-all ${
            activeBackground === 'none'
              ? 'border-primary bg-primary/10'
              : 'hover:bg-muted border-transparent'
          }`}
        >
          <Ban className='mb-1 h-5 w-5 opacity-70' />
          <span className='text-[10px]'>None</span>
        </button>

        {/* BLUR */}
        <button
          onClick={() => setActiveBackground('blur')}
          className={`flex aspect-video flex-col items-center justify-center rounded-lg border-2 transition-all ${
            activeBackground === 'blur'
              ? 'border-primary bg-primary/10'
              : 'hover:bg-muted border-transparent'
          }`}
        >
          <div className='bg-foreground/20 mb-1 h-6 w-6 rounded-full blur-sm' />
          <span className='text-[10px]'>Blur</span>
        </button>

        {/* PRESET 1 */}
        <button
          onClick={() => setActiveBackground('image-1')}
          className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
            activeBackground === 'image-1'
              ? 'border-primary'
              : 'border-transparent hover:opacity-80'
          }`}
        >
          <img src='/bedroom.jpg' alt='Bedroom' className='h-full w-full object-cover' />
        </button>

        {/* PRESET 2 */}
        <button
          onClick={() => setActiveBackground('image-2')}
          className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
            activeBackground === 'image-2'
              ? 'border-primary'
              : 'border-transparent hover:opacity-80'
          }`}
        >
          <img src='/cafe.jpg' alt='Cafe' className='h-full w-full object-cover' />
        </button>

        {/* PRESET 3 */}
        <button
          onClick={() => setActiveBackground('image-3')}
          className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
            activeBackground === 'image-3'
              ? 'border-primary'
              : 'border-transparent hover:opacity-80'
          }`}
        >
          <img src='/office.jpeg' alt='Office' className='h-full w-full object-cover' />
        </button>

        {/* CUSTOM */}
        <label
          className={`flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 transition-all ${
            activeBackground === 'custom'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:bg-muted border-dashed'
          }`}
        >
          {customImage && activeBackground === 'custom' ? (
            <img src={customImage} alt='Custom' className='h-full w-full rounded-md object-cover' />
          ) : (
            <>
              <Upload className='mb-1 h-5 w-5 opacity-70' />
              <span className='text-[10px]'>Custom</span>
            </>
          )}
          <input type='file' accept='image/*' className='hidden' onChange={handleFileUpload} />
        </label>
      </div>

      {processing && (
        <div className='text-muted-foreground mt-2 animate-pulse text-center text-[10px]'>
          Processing background...
        </div>
      )}
    </div>
  )
}
