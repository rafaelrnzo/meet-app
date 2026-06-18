'use client'

import type { FC } from 'react'
import type { VideoCodec } from 'livekit-client'
import type { LocalUserChoices } from '@livekit/components-react'
import type { ConnectionDetails } from '@/feat/types'
import type { LocalUserChoicesPassword } from '@/feat/Room'
import { useEffect, useRef, useState } from 'react'
import { RoomContent, RoomConference, InterceptorRoom, PreJoin } from '@/feat/Room'
import { ConnectionInterceptor } from '@/feat/enum'

const LIVEKIT_CSS_ENABLE = true

const LIVEKIT_CSS_ID = 'livekit-style'

const LIVEKIT_CSS_PATH = '/lib/css/livekit.css'

export interface RoomDetailProps {
  roomName: string
  region?: string
  hq: boolean
  codec: VideoCodec
  singlePeerConnection: boolean
  isTesting?: boolean
}

export const RoomDetail: FC<RoomDetailProps> = (props) => {
  const [interceptor, setInterceptor] = useState<ConnectionInterceptor | null>(null)
  const [isCSSLoaded, setIsCSSLoaded] = useState(!LIVEKIT_CSS_ENABLE)
  const [loading, setLoading] = useState(false)
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>()
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | undefined>()

  // Reference
  const preJoinDefaults = useRef({ username: '', audioEnabled: false, videoEnabled: false })
  const connectionDetailsRef = useRef<ConnectionDetails | undefined>(undefined)
  const isReady = !!connectionDetails && !!preJoinChoices
  const handlePreJoinError = useRef((e: unknown) => console.log('Failed to handle prejoin:', e))
  const handlePreJoinSubmit = useRef(async ({ password, ...values }: LocalUserChoicesPassword) => {
    const url = new URL('/api/connection-details', window.location.origin)

    url.searchParams.append('roomName', props.roomName)
    url.searchParams.append('participantName', values.username)

    setPreJoinChoices(values)
    setLoading(true)

    if (props.region) url.searchParams.append('region', props.region)
    if (password) url.searchParams.append('password', password)

    try {
      const connectionDetailsResp = await fetch(url.toString())
      const { interceptor, ...connectionDetailsData } =
        (await connectionDetailsResp.json()) as ConnectionDetails & {
          interceptor?: ConnectionInterceptor
        }

      if (interceptor) {
        setInterceptor(interceptor)
        connectionDetailsRef.current = connectionDetailsData
      } else {
        setConnectionDetails(connectionDetailsData)
      }
    } catch (e) {
      setInterceptor(ConnectionInterceptor.Unknown)
      console.log('Failed to join the room:', e)
    } finally {
      setLoading(false)
    }
  })

  const handleBackToPrejoin = useRef(() => {
    setInterceptor(null)
    setPreJoinChoices(undefined)
  })

  useEffect(() => {
    if (!isReady) {
      const livekitStyle = document.getElementById(LIVEKIT_CSS_ID)

      if (!livekitStyle) {
        return
      }

      document.head.removeChild(livekitStyle)
    } else {
      if (LIVEKIT_CSS_ENABLE) {
        const livekitCss = document.createElement('link')

        livekitCss.rel = 'stylesheet'
        livekitCss.id = LIVEKIT_CSS_ID
        livekitCss.href = window.location.origin + LIVEKIT_CSS_PATH
        livekitCss.onload = () => {
          setInterceptor(null) // Ready to live after css is fully loaded
          setIsCSSLoaded(true)
        }

        document.head.appendChild(livekitCss)
      }
    }
  }, [isReady])

  useEffect(() => {
    if (interceptor === ConnectionInterceptor.Waiting) {
      const timeout = setTimeout(() => setConnectionDetails(connectionDetailsRef.current), 5_000)

      return () => window.clearTimeout(timeout)
    }
  }, [interceptor])

  if (interceptor) {
    return <InterceptorRoom interceptor={interceptor} onClick={handleBackToPrejoin.current} />
  }

  return isReady && isCSSLoaded ? (
    <RoomConference
      connectionDetails={connectionDetails}
      userChoices={preJoinChoices}
      options={{
        codec: props.codec,
        hq: props.hq,
        singlePeerConnection: props.singlePeerConnection,
      }}
    >
      <RoomContent />
    </RoomConference>
  ) : (
    <PreJoin
      defaults={{ ...preJoinDefaults.current, username: 'Rafa' }}
      onSubmit={handlePreJoinSubmit.current}
      onError={handlePreJoinError.current}
      isLoading={loading}
      // isGuest={props.isTesting}
      isGuest
    />
  )
}
