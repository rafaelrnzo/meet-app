'use client'

import type { CameraResolution } from '@/feat/enum'
import { useEffect, useState } from 'react'
import { ConnectionState, Track, VideoPresets } from 'livekit-client'
import {
  useRoomContext,
  useConnectionState,
  useLocalParticipant,
  usePersistentUserChoices,
  useTracks,
} from '@livekit/components-react'
import { setupMediaToggle } from '@livekit/components-core'
import { CameraResolutionOptions } from '@/feat/const'

export const useControls = () => {
  const { localParticipant } = useLocalParticipant()
  const { userChoices, saveVideoInputEnabled, saveAudioInputEnabled } = usePersistentUserChoices()
  const [activeState, setActiveState] = useState<'camera' | 'reaction' | ''>('')
  const [audioEnabled, setAudioEnabled] = useState(userChoices.audioEnabled)
  const [videoEnabled, setVideoEnabled] = useState(userChoices.videoEnabled)
  const [shareScreenEnabled, setShareScreenEnabled] = useState(false)
  const [resolution, setResolution] = useState(VideoPresets.h720.resolution)
  const [maxResolution, setMaxResolution] = useState<number>(Infinity)
  const room = useRoomContext()
  const state = useConnectionState(room)
  const isConnecting = state === ConnectionState.Connecting
  const isCameraActive = activeState === 'camera'
  const isReactionActive = activeState === 'reaction'
  const disconnect = room.disconnect

  // Remote track
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare])
  const track = tracks.find(({ participant: { identity } }) => identity === localParticipant.identity) // prettier-ignore
  const chevronEnabled = !(!track || !videoEnabled)

  // Resolution option
  const resolutionOptions = CameraResolutionOptions.map((option) => ({
    ...option,
    disabled: !track || option.value > maxResolution,
  }))

  const handleResolutionChange = async (quality: CameraResolution) => {
    const localTrack = localParticipant?.getTrackPublication(Track.Source.Camera)?.videoTrack
    const preset = VideoPresets[`h${quality}` as keyof typeof VideoPresets]
    if (!localTrack || !preset) return

    try {
      await localTrack.restartTrack({ resolution: preset.resolution })
      setResolution(preset.resolution)
    } catch (error) {
      console.error('Gagal mengubah resolusi kamera:', error)
    }
  }

  const handleToggleShareScreen = () => {
    if (!room) return

    const track = setupMediaToggle(
      Track.Source.ScreenShare,
      room,
      { audio: true, selfBrowserSurface: 'include' },
      undefined,
      (error) => {
        console.log('Failed publishing share screen track:', error)
      }
    )

    track.toggle(!shareScreenEnabled).then((result) => setShareScreenEnabled(result ?? false))
  }

  // Sync storage, for prejoin
  useEffect(() => saveVideoInputEnabled(videoEnabled), [saveVideoInputEnabled, videoEnabled])
  useEffect(() => saveAudioInputEnabled(audioEnabled), [saveAudioInputEnabled, audioEnabled])

  // Sync active state
  useEffect(
    () => (!videoEnabled ? setActiveState((prev) => (prev === 'camera' ? '' : prev)) : void 0),
    [videoEnabled]
  )

  // Sync video camera by its resolution
  useEffect(
    () => void localParticipant.setCameraEnabled(videoEnabled, { resolution }),
    [localParticipant, videoEnabled, resolution]
  )

  // Sync screen share track
  useEffect(() => {
    if (!tracks.some((track) => track.source === Track.Source.ScreenShare)) {
      setShareScreenEnabled(false)
    }
  }, [tracks])

  // Sync max resolution by media stream video
  useEffect(() => {
    const stream = track?.publication.track?.mediaStreamTrack
    if (stream?.id) {
      const max = Math.max(
        stream.getCapabilities().height?.max ?? -1,
        stream.getSettings().height ?? -1
      )

      if (max > 0) setMaxResolution(max)
    }
  }, [track])

  return {
    isConnecting,
    isCameraActive,
    isReactionActive,
    audioEnabled,
    videoEnabled,
    chevronEnabled,
    shareScreenEnabled,
    resolution,
    maxResolution,
    resolutionOptions,
    disconnect,
    handleResolutionChange,
    handleToggleShareScreen,
    setAudioEnabled,
    setVideoEnabled,
    setActiveState,
    setResolution,
    setMaxResolution,
  }
}
