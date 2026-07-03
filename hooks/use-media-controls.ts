import type {
  CreateLocalTracksOptions,
  Room,
  TrackProcessor,
  VideoProcessorOptions,
} from 'livekit-client'
import type { LocalUserChoices, ToggleSource } from '@livekit/components-core'
import { useState, useEffect, useRef, useEffectEvent, useMemo } from 'react'
import { RoomEvent, Track, facingModeFromLocalTrack } from 'livekit-client'
import { usePersistentUserChoices } from '@livekit/components-react'
import { setupMediaToggle } from '@livekit/components-core'
import { useProgressiveTrack } from '@/hooks'

// Defined independently — no import from PreJoin — to avoid circular dependencies.
export interface MediaControlsOption {
  defaults?: Partial<LocalUserChoices>
  autoCheck?: boolean
  micLabel?: string
  camLabel?: string
  persistUserChoices?: boolean
  videoProcessor?: TrackProcessor<Track.Kind.Video, VideoProcessorOptions>
  onError?: (error: Error) => void
  room?: Room
}

export function useMediaControls(options?: MediaControlsOption) {
  const {
    defaults = {},
    onError,
    videoProcessor,
    persistUserChoices = true,
    autoCheck = false,
    micLabel = '',
    camLabel = '',
    room,
  } = useMemo(() => ({ ...options }), [options])

  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
  } = usePersistentUserChoices({
    defaults,
    preventSave: !persistUserChoices,
    preventLoad: !persistUserChoices,
  })

  // Initialize device settings
  const [audioEnabled, setAudioEnabled] = useState(initialUserChoices.audioEnabled)
  const [videoEnabled, setVideoEnabled] = useState(initialUserChoices.videoEnabled)
  const [audioDeviceId, setAudioDeviceId] = useState(initialUserChoices.audioDeviceId)
  const [videoDeviceId, setVideoDeviceId] = useState(initialUserChoices.videoDeviceId)
  const [deniedDevices, setDeniedDevices] = useState<string[]>([])
  const [activeAudioLabel, setActiveAudioLabel] = useState(micLabel)
  const [activeVideoLabel, setActiveVideoLabel] = useState(camLabel)
  const [shareScreenEnabled, setShareScreenEnabled] = useState(false)

  // Capture config — derived from initialUserChoices, stable at mount
  const audioConfig = { deviceId: initialUserChoices.audioDeviceId }
  const videoConfig = {
    deviceId: initialUserChoices.videoDeviceId,
    processor: videoProcessor,
  }

  const [media, setMedia] = useState<CreateLocalTracksOptions>({
    audio: autoCheck ? audioConfig : audioEnabled ? audioConfig : false,
    video: autoCheck ? videoConfig : videoEnabled ? videoConfig : false,
  })

  const formattedLabel = deniedDevices
    .map((d) => d.replace('video', 'kamera').replace('audio', 'mikrofon'))
    .join(' dan ')

  const tracks = useProgressiveTrack(media, (error, errorKind) => {
    setDeniedDevices((prev) => Array.from(new Set([...prev, errorKind])))
    onError?.(error)

    if (errorKind === Track.Kind.Audio) setAudioEnabled(false)
    if (errorKind === Track.Kind.Video) setVideoEnabled(false)
  })

  const videoTrack = tracks?.find((track) => track.kind === Track.Kind.Video)
  const audioTrack = tracks?.find((track) => track.kind === Track.Kind.Audio)
  const facingMode = !videoTrack ? 'undefined' : facingModeFromLocalTrack(videoTrack)?.facingMode
  const videoEl = useRef<HTMLVideoElement>(null)

  const handlePublishTrack = useEffectEvent((source: ToggleSource, enabled: boolean) => {
    if (!room) return

    const shareScreenOption = { audio: true, selfBrowserSurface: 'include' } as const
    const captureOptions = source === Track.Source.ScreenShare ? shareScreenOption : undefined
    const track = setupMediaToggle(source, room, captureOptions, undefined, (error) => {
      if (source === Track.Source.ScreenShare) {
        setShareScreenEnabled(false)
      }
      console.log(`Error when publishing track: `, error)
    })

    track.toggle(enabled)
  })

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev)

    if (!audioEnabled) {
      setMedia((prev) => ({
        ...prev,
        audio: { deviceId: audioDeviceId },
      }))
    } else {
      setMedia((prev) => ({ ...prev, audio: false }))
    }
  }

  const handleManualToggleAudio = (enabled: boolean) => {
    setAudioEnabled(enabled)

    if (enabled) {
      setMedia((prev) => ({
        ...prev,
        audio: { deviceId: audioDeviceId },
      }))
    } else {
      setMedia((prev) => ({ ...prev, audio: false }))
    }

    if (room?.localParticipant) {
      room.localParticipant
        .setMicrophoneEnabled(enabled)
        .catch((err) => console.error('Failed to respond to the admin voice command', err))
    }
  }

  const handleToggleVideo = () => {
    setVideoEnabled((prev) => !prev)

    if (!videoEnabled) {
      setMedia((prev) => ({
        ...prev,
        video: {
          deviceId: videoDeviceId,
          processor: videoProcessor,
        },
      }))
    } else {
      setMedia((prev) => ({ ...prev, video: false }))
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
        console.log(`Error when publishing track: `, error)
      }
    )

    track.toggle(!shareScreenEnabled).then((result) => setShareScreenEnabled(result ?? false))
  }

  // Save user choices to persistent storage
  useEffect(() => saveAudioInputEnabled(audioEnabled), [audioEnabled, saveAudioInputEnabled])
  useEffect(() => saveVideoInputEnabled(videoEnabled), [videoEnabled, saveVideoInputEnabled])
  useEffect(() => saveAudioInputDeviceId(audioDeviceId), [audioDeviceId, saveAudioInputDeviceId])
  useEffect(() => saveVideoInputDeviceId(videoDeviceId), [videoDeviceId, saveVideoInputDeviceId])

  // Attach / detach video track from the <video> element
  useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute()
      videoTrack.attach(videoEl.current)
    }

    return () => {
      videoTrack?.detach()
    }
  }, [videoTrack])

  // Sync state based on local audio track
  useEffect(() => {
    if (audioTrack) {
      setAudioEnabled((prev) => (!prev ? !!audioTrack : prev))
      setActiveAudioLabel((prev) => audioTrack?.mediaStreamTrack.label ?? prev)
      setDeniedDevices((prev) =>
        !prev.includes(Track.Kind.Audio)
          ? prev
          : prev.filter((previous) => previous !== Track.Kind.Audio)
      )
    }
  }, [audioTrack])

  // Sync state based on local video track
  useEffect(() => {
    if (videoTrack) {
      setVideoEnabled((prev) => (!prev ? !!videoTrack : prev))
      setActiveVideoLabel((prev) => videoTrack?.mediaStreamTrack.label ?? prev)
      setDeniedDevices((prev) =>
        !prev.includes(Track.Kind.Video)
          ? prev
          : prev.filter((previous) => previous !== Track.Kind.Video)
      )
    }
  }, [videoTrack])

  // Sync published track with local track (no-op when room is undefined — i.e. in PreJoin)
  useEffect(() => handlePublishTrack(Track.Source.Microphone, audioEnabled), [audioEnabled])
  useEffect(() => handlePublishTrack(Track.Source.Camera, videoEnabled), [videoEnabled])

  // Listener
  useEffect(() => {
    if (!room) return

    const handleTrackMutedOrUnmuted = () => {
      const isMicEnabled = !!room.localParticipant?.isMicrophoneEnabled
      setAudioEnabled(isMicEnabled)

      setMedia((prev) => ({
        ...prev,
        audio: isMicEnabled ? { deviceId: audioDeviceId } : false,
      }))
    }

    room.localParticipant?.on(RoomEvent.TrackMuted, handleTrackMutedOrUnmuted)
    room.localParticipant?.on(RoomEvent.TrackUnmuted, handleTrackMutedOrUnmuted)

    return () => {
      room.localParticipant?.off(RoomEvent.TrackMuted, handleTrackMutedOrUnmuted)
      room.localParticipant?.off(RoomEvent.TrackUnmuted, handleTrackMutedOrUnmuted)
    }
  }, [room, audioDeviceId])

  return {
    // Expose so usePreJoin can read initialUserChoices.username without a second hook call
    initialUserChoices,

    // State
    audioEnabled,
    videoEnabled,
    audioDeviceId,
    videoDeviceId,
    videoTrack,
    audioTrack,
    shareScreenEnabled,
    deniedDevices,
    activeAudioLabel,
    activeVideoLabel,
    formattedLabel,
    facingMode,
    videoEl,
    media,

    // Setters
    setAudioEnabled,
    setVideoEnabled,
    setAudioDeviceId,
    setVideoDeviceId,
    setShareScreenEnabled,
    setDeniedDevices,
    setActiveAudioLabel,
    setActiveVideoLabel,
    setMedia,

    // Handlers
    handleToggleAudio,
    handleManualToggleAudio,
    handleToggleVideo,
    handleToggleShareScreen,
  }
}
