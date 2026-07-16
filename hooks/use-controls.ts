'use client'

import type { CameraResolution } from '@/feat/enum'
import { useEffect, useState } from 'react'
import { ConnectionState, RoomEvent, Track, VideoPresets } from 'livekit-client'
import {
  useRoomContext,
  useConnectionState,
  useLocalParticipant,
  usePersistentUserChoices,
  useTracks,
} from '@livekit/components-react'
import { setupMediaToggle } from '@livekit/components-core'
import { CameraResolutionOptions } from '@/feat/const'
import { toast } from '@/components/ui/sonner'

export const useControls = () => {
  const { localParticipant } = useLocalParticipant()
  const { saveVideoInputEnabled, saveAudioInputEnabled } = usePersistentUserChoices()
  const [activeState, setActiveState] = useState<'camera' | 'reaction' | ''>('')
  const [shareScreenEnabled, setShareScreenEnabled] = useState(false)
  const [resolution, setResolution] = useState(VideoPresets.h720.resolution)
  const [maxResolution, setMaxResolution] = useState<number>(Infinity)
  const audioEnabled = localParticipant.isMicrophoneEnabled
  const videoEnabled = localParticipant.isCameraEnabled
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

  const handleDeniedPermission = (kind: 'kamera' | 'mikrofon' | 'screen') => {
    toast.device(
      `Error: Tidak dapat menemukan ${kind}, atau pengguna menolak atas izin akses ` +
        `${kind}. Silahkan muat ulang halaman ini, atau tutup dan kembali ke halaman ` +
        `ini untuk mengaktifkan ${kind}.`,
      { position: 'top-center', duration: 5_000 }
    )
  }

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
        handleDeniedPermission('screen')
        console.log('Failed publishing share screen track:', error)
      }
    )

    track.toggle(!shareScreenEnabled).then((result) => {
      setShareScreenEnabled(result ?? false)
    })
  }

  const handleToggleAudio = async () => {
    const targetState = !audioEnabled

    try {
      await localParticipant.setMicrophoneEnabled(targetState)
      saveAudioInputEnabled(targetState)
    } catch (error) {
      handleDeniedPermission('mikrofon')
      console.error('Gagal mengubah status mikrofon:', error)
    }
  }

  const handleToggleVideo = async () => {
    const targetState = !videoEnabled

    try {
      await localParticipant.setCameraEnabled(targetState, { resolution })
      saveVideoInputEnabled(targetState)
    } catch (error) {
      handleDeniedPermission('kamera')
      console.error('Gagal mengubah status kamera:', error)
    }
  }

  // Sync active state
  useEffect(
    () => (!videoEnabled ? setActiveState((prev) => (prev === 'camera' ? '' : prev)) : void 0),
    [videoEnabled]
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

  // Sync audio and video
  useEffect(() => {
    if (!room.localParticipant) return

    const handleTrackMutedOrUnmuted = () => {
      saveAudioInputEnabled(room.localParticipant.isMicrophoneEnabled)
    }

    room.localParticipant.on(RoomEvent.TrackMuted, handleTrackMutedOrUnmuted)
    room.localParticipant.on(RoomEvent.TrackUnmuted, handleTrackMutedOrUnmuted)

    return () => {
      room.localParticipant.off(RoomEvent.TrackMuted, handleTrackMutedOrUnmuted)
      room.localParticipant.off(RoomEvent.TrackUnmuted, handleTrackMutedOrUnmuted)
    }
  }, [room, saveAudioInputEnabled])

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
    handleToggleAudio,
    handleToggleVideo,
    setActiveState,
    setResolution,
    setMaxResolution,
  }
}
