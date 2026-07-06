'use client'

import type { CameraResolutionOptions } from '@/feat/const'
import { useEffect, useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant, useTracks } from '@livekit/components-react'
import { CameraResolution } from '@/feat/enum'

interface UseCameraQualityProps {
  isVideoEnabled?: boolean
  isOpen: boolean
}

export const useCameraQuality = ({ isVideoEnabled }: UseCameraQualityProps) => {
  const { localParticipant } = useLocalParticipant()
  const [selectedQuality, setSelectedQuality] = useState<CameraResolution>(CameraResolution.LOW)
  const [maxCapabilities, setMaxCapabilities] = useState({ width: -1, height: -1 })
  const tracks = useTracks([Track.Source.Camera])
  const videoTrack = tracks.find((t) => t.participant.identity === localParticipant.identity)
  const track = videoTrack?.publication.track?.mediaStreamTrack

  useEffect(() => {
    if (track) {
      const capabilities = track.getCapabilities()
      const settings = track.getSettings()
      const constraint = track.getConstraints()

      // No need to reset, let livekit does
      setMaxCapabilities({
        width: Math.max(
          capabilities.width?.max ?? 0,
          settings.width ?? 0,
          constraint.width as number
        ),
        height: Math.max(
          capabilities.height?.max ?? 0,
          settings.height ?? 0,
          constraint.height as number
        ),
      })
    }
  }, [track])

  // "handleToggleMenuResolution" should listen video track in effect

  const changeResolution = async (
    quality: CameraResolution,
    option: (typeof CameraResolutionOptions)[0]
  ) => {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const targetPreset = { value: VideoPresets.h360 }

    await localParticipant.setCameraEnabled(false)

    switch (quality) {
      case CameraResolution.LOW:
        targetPreset.value = VideoPresets.h360
        break
      case CameraResolution.STANDART:
        targetPreset.value = VideoPresets.h540
        break
      case CameraResolution.HIGH:
        targetPreset.value = VideoPresets.h720
        break
      case CameraResolution.FULLHD:
        targetPreset.value = VideoPresets.h1080
        break
      case CameraResolution.QHD:
        targetPreset.value = VideoPresets.h1440
        break
      case CameraResolution.UHD:
        targetPreset.value = VideoPresets.h2160
        break
      default:
        break
    }

    try {
      const { value } = targetPreset

      // Restart instead apply constraint
      await localTrack?.restartTrack({ resolution: value.resolution })

      const activeSettings = localTrack?.mediaStreamTrack.getSettings()
      console.log(`Resolusi berhasil diubah ke: ${activeSettings?.width}x${activeSettings?.height}`)
      setSelectedQuality(option.value)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  const isOptionDisabled = (value: string) => {
    if (!isVideoEnabled || !maxCapabilities) return false

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
    changeResolution,
    isOptionDisabled,
    setMaxCapabilities,
  }
}
