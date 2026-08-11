'use client'

import type { FC, ReactNode, RefObject } from 'react'
import type {
  RoomOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
  VideoCodec,
} from 'livekit-client'
import type { LocalUserChoices } from '@livekit/components-react'
import type { ConnectionDetails } from '@/feat/types'
import type { RoomMetadata } from '@/feat/rooms/dto'
import { useEffect, useMemo, useRef } from 'react'
import { ConnectionState, Room, RoomEvent, VideoPresets } from 'livekit-client'
import { RoomContext } from '@livekit/components-react'
import { leaveRoom } from '@/lib/api/admin-api'
import { useParamsState } from '@/hooks'
import { ParticipantWaitingProvider } from '@/feat/Room/ParticipantWaitingProvider'
import { RoomState, RoomLayout } from '@/feat/Room'
import { SearchParamsKey } from '@/feat/enum'

export interface RoomConferenceProps {
  children?: ReactNode
  userChoices: LocalUserChoices
  connectionDetails: ConnectionDetails
  metadata: RoomMetadata
  options: {
    hq: boolean
    codec: VideoCodec
    singlePeerConnection: boolean
  }
  isNotfoundRef: RefObject<boolean>
}

export const RoomConference: FC<RoomConferenceProps> = ({ children, ...props }) => {
  const propsRef = useRef(props)
  const roomOptions = useRef((): RoomOptions => {
    const { current } = propsRef
    const videoCodec: VideoCodec | undefined = current.options.codec ?? 'vp9'
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: current.userChoices.videoDeviceId ?? undefined,
      resolution: current.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    }
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: current.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: true,
      videoCodec,
    }

    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: current.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      singlePeerConnection: current.options.singlePeerConnection,
    }
  })

  const { router, searchParams } = useParamsState<{ name: string }>()
  const room = useMemo(() => new Room(roomOptions.current()), []) // Maybe changed

  const roomEvent = useRef({
    leave: () => {
      if (propsRef.current.isNotfoundRef.current) {
        return
      } else {
        router.replace(`/${searchParams.get(SearchParamsKey.FromCode) ?? ''}`)
      }
    },
    error: () => {
      //
    },
  })

  useEffect(() => {
    const { serverUrl, participantToken } = propsRef.current.connectionDetails
    const { error, leave } = roomEvent.current

    room.on(RoomEvent.Disconnected, leave)
    room.on(RoomEvent.MediaDevicesError, error)

    let mounted = true

    async function connect() {
      try {
        await room.connect(serverUrl, participantToken, {
          autoSubscribe: true,
        })

        if (!mounted) return

        if (propsRef.current.userChoices.videoEnabled) {
          await room.localParticipant.setCameraEnabled(true)
        }

        if (propsRef.current.userChoices.audioEnabled) {
          await room.localParticipant.setMicrophoneEnabled(true)
        }
      } catch (e) {
        console.log('Failed to connect to the room:', e)
      }
    }

    connect()

    return () => {
      mounted = false

      room.off(RoomEvent.Disconnected, leave)
      room.off(RoomEvent.MediaDevicesError, error)

      if (
        room.state === ConnectionState.Connected ||
        room.state === ConnectionState.Connecting ||
        room.state === ConnectionState.Reconnecting
      ) {
        room.disconnect().finally(() => leaveRoom(room.name))
      }
    }
  }, [room])

  return (
    <RoomContext.Provider value={room}>
      <ParticipantWaitingProvider>
        <RoomState>
          <RoomLayout>{children}</RoomLayout>
        </RoomState>
      </ParticipantWaitingProvider>
    </RoomContext.Provider>
  )
}
