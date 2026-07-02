'use client'

import type { CameraResolutionOptions } from '@/feat/const'
import { useEffect, useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant } from '@livekit/components-react'
import { CameraResolution } from '@/feat/enum'

interface UseCameraQualityProps {
  isVideoEnabled?: boolean
}

const PRESET_MAP: Record<CameraResolution, typeof VideoPresets.h360> = {
  [CameraResolution.LOW]: VideoPresets.h360,
  [CameraResolution.STANDART]: VideoPresets.h540,
  [CameraResolution.HIGH]: VideoPresets.h720,
  [CameraResolution.FULLHD]: VideoPresets.h1080,
  [CameraResolution.QHD]: VideoPresets.h1440,
  [CameraResolution.UHD]: VideoPresets.h2160,
}

export const useCameraQuality = ({ isVideoEnabled }: UseCameraQualityProps) => {
  const { localParticipant } = useLocalParticipant()
  const [selectedQuality, setSelectedQuality] = useState<CameraResolution>(CameraResolution.LOW)
  const [maxCapabilities, setMaxCapabilities] = useState<{ width: number; height: number } | null>(
    null
  )

  const changeResolution = async (
    quality: CameraResolution,
    option: (typeof CameraResolutionOptions)[0]
  ) => {
    const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera)
    const localVideoTrack = cameraPublication?.videoTrack

    if (!localVideoTrack) {
      return
    }

    try {
      const targetPreset = PRESET_MAP[quality] ?? VideoPresets.h360
      // restartTrack, bukan applyConstraints langsung, biar LiveKit
      // ikut re-negosiasi encoding/simulcast, bukan cuma ubah capture lokal
      await localVideoTrack.restartTrack({
        resolution: targetPreset,
      })

      setSelectedQuality(option.value)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  const isOptionDisabled = (value: CameraResolution) =>
    !isVideoEnabled || !maxCapabilities || !(value in PRESET_MAP)
      ? false
      : PRESET_MAP[value].width > maxCapabilities.width

  useEffect(() => {
    if (!isVideoEnabled) {
      setMaxCapabilities(null)
      return
    }

    const cameraPublication = localParticipant.getTrackPublication(Track.Source.Camera)
    const track = cameraPublication?.videoTrack?.mediaStreamTrack
    if (!track) return

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

    if (typeof track.getSettings === 'function') {
      const settings = track.getSettings()

      setMaxCapabilities({
        width: settings.width ?? 1280,
        height: settings.height ?? 720,
      })
    }
  }, [isVideoEnabled, localParticipant])

  return {
    selectedQuality,
    changeResolution,
    isOptionDisabled,
  }
}
