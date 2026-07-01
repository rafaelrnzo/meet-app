'use client'

import type { CameraResolutionOptions } from '@/feat/const'
import { useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant } from '@livekit/components-react'
import { CameraResolution } from '@/feat/enum'

interface UseCameraQualityProps {
  videoEnabled: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const useCameraQuality = ({ videoEnabled, isOpen, setIsOpen }: UseCameraQualityProps) => {
  const { localParticipant } = useLocalParticipant()
  const [selectedQuality, setSelectedQuality] = useState<CameraResolution>(CameraResolution.LOW)
  const [maxCapabilities, setMaxCapabilities] = useState<{ width: number; height: number } | null>(
    null
  )

  const handleToggleMenuResolution = () => {
    if (!isOpen && videoEnabled) {
      const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera)
      const videoTrack = cameraPublication?.videoTrack

      if (videoTrack?.mediaStreamTrack) {
        const track = videoTrack.mediaStreamTrack

        // Support via getSettings (Chrome, Edge, Opera)
        if (typeof track.getCapabilities === 'function') {
          try {
            const capabilities = track.getCapabilities()
            if (capabilities?.width?.max) {
              setMaxCapabilities({
                width: capabilities.width.max,
                height: capabilities.height?.max ?? 720,
              })
              return
            }
          } catch (error) {
            console.warn('Gagal getCapabilities, beralih ke getSettings:', error)
          }
        }

        // Support via getSettings (Safari, Firefox, Mobile)
        if (typeof track.getSettings === 'function') {
          const settings = track.getSettings()
          setMaxCapabilities({
            width: settings.width ?? 1280,
            height: settings.height ?? 720,
          })
        }
      }
    } else if (!isOpen) {
      setMaxCapabilities(null)
    }
  }

  const changeResolution = async (
    quality: CameraResolution,
    option: (typeof CameraResolutionOptions)[0]
  ) => {
    const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera)

    if (cameraPublication?.videoTrack) {
      const localVideoTrack = cameraPublication.videoTrack
      let targetPreset = VideoPresets.h360

      switch (quality) {
        case CameraResolution.LOW:
          targetPreset = VideoPresets.h360
          break
        case CameraResolution.STANDART:
          targetPreset = VideoPresets.h540
          break
        case CameraResolution.HIGH:
          targetPreset = VideoPresets.h720
          break
        case CameraResolution.FULLHD:
          targetPreset = VideoPresets.h1080
          break
        case CameraResolution.QHD:
          targetPreset = VideoPresets.h1440
          break
        case CameraResolution.UHD:
          targetPreset = VideoPresets.h2160
          break
        default:
          break
      }

      try {
        await localVideoTrack.mediaStreamTrack.applyConstraints({
          width: targetPreset.width,
          height: targetPreset.height,
        })

        const activeSettings = localVideoTrack.mediaStreamTrack.getSettings()
        console.log(`Resolusi berhasil diubah ke: ${activeSettings.width}x${activeSettings.height}`)
        setSelectedQuality(option.value)
      } catch (error) {
        console.error('Gagal mengubah resolusi kamera:', error)
      }
    }

    setIsOpen(false)
    setMaxCapabilities(null)
  }

  const isOptionDisabled = (value: string) => {
    if (!videoEnabled || !maxCapabilities) return false

    let optionWidth = 1280
    if (value === '360p') optionWidth = 640
    if (value === '540p') optionWidth = 960
    if (value === '720p') optionWidth = 1280
    if (value === '1080p') optionWidth = 1920
    if (value === '2k') optionWidth = 2560
    if (value === '4k') optionWidth = 3840

    return optionWidth > maxCapabilities.width
  }

  return {
    selectedQuality,
    handleToggleMenuResolution,
    changeResolution,
    isOptionDisabled,
    setMaxCapabilities,
  }
}
