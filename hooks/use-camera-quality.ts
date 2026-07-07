'use client'

import type { CameraResolution } from '@/feat/enum'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Track, VideoPresets } from 'livekit-client'
import { useLocalParticipant, usePersistentUserChoices, useTracks } from '@livekit/components-react'

export const useCameraQuality = () => {
  const { localParticipant } = useLocalParticipant()
  const { saveVideoInputEnabled } = usePersistentUserChoices()
  const [resolution, setResolution] = useState(VideoPresets.h720.resolution)
  const [maxResolution, setMaxResolution] = useState<number>(Infinity)
  const pendingResolutionRef = useRef(VideoPresets.h720.resolution)
  const tracks = useTracks([Track.Source.Camera])
  const videoTrack = tracks.find((t) => t.participant.identity === localParticipant.identity)
  const track = videoTrack?.publication.track?.mediaStreamTrack
  const isCameraEnabled = localParticipant.isCameraEnabled

  const changeResolution = async (quality: CameraResolution) => {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const preset = VideoPresets[`h${quality}` as keyof typeof VideoPresets]

    if (!preset || !localTrack) {
      return
    }

    // Capture preset resolution
    pendingResolutionRef.current = preset.resolution

    try {
      await localTrack.restartTrack({ resolution: preset.resolution })
      setResolution(preset.resolution)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  // Manually toggle camera - make it persistance follow livekit api
  const toggleCamera = async () => {
    if (!localParticipant.isCameraEnabled) {
      // Set resolution when enable with correct constraint acquired by browser it self.
      await localParticipant.setCameraEnabled(true, {
        resolution: pendingResolutionRef.current,
      })
    } else {
      await localParticipant.setCameraEnabled(false)
    }

    saveVideoInputEnabled(localParticipant.isCameraEnabled)
  }

  const syncMaxResolutionEvent = useEffectEvent((trackId?: string) => {
    if (!track || track?.id !== trackId) return

    const max = Math.max(
      track.getCapabilities().height?.max ?? -1,
      track.getSettings().height ?? -1
    )

    if (max > 0) setMaxResolution(max)
  })

  const syncResolutionStateEvent = useEffectEvent((trackId?: string) => {
    if (!track || track?.id !== trackId) return

    const currentHeight = track.getSettings().height
    if (currentHeight) {
      // Update the real track, instead forcing to restart
      setResolution((prev) => ({
        ...prev,
        height: currentHeight,
        width: track.getSettings().width ?? prev.width,
      }))
    }
  })

  // Sync max capability
  useEffect(() => syncMaxResolutionEvent(track?.id), [track?.id])

  // Sync resolution state when new track comes in
  useEffect(() => syncResolutionStateEvent(track?.id), [track?.id])

  return {
    resolution,
    maxResolution,
    isCameraEnabled,
    changeResolution,
    toggleCamera,
  }
}
