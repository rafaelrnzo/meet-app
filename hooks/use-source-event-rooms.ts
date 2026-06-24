import { useEffectEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type SourceEventType = (typeof SOURCE_EVENTS)[number]
const SOURCE_EVENTS = [
  'connected',
  'room_updated',
  'participant_joined',
  'participant_left',
  'recording_started',
  'recording_stopped',
  'ping',
] as const

type SourceEventParams = {
  type: SourceEventType
  data?: {
    room_id?: string
    num_publishers?: number
    participants?: number
    is_live?: boolean
    updated_at?: string
    identity?: string
    participant_count?: number
    egress_id?: string
    status?: string
    timestamp?: number
  }
}

export function useSourceEventRooms(callbackFn: (event: SourceEventParams) => void) {
  const callbackEvent = useEffectEvent(callbackFn)
  const { data: session } = useSession()

  const parseCallbackFn = useEffectEvent((event: MessageEvent<string>) => {
    try {
      const { type, data } = JSON.parse(event.data) as SourceEventParams
      if (['ping', 'connected'].includes(type)) return

      callbackEvent({ type, data })
    } catch (err) {
      console.error('Failed to parse souce event rooms', err, event.data)
    }
  })

  useEffect(() => {
    const publicUrl = session?.publicUrl ?? ''
    const token = session?.access_token ?? ''

    const es = new EventSource(`${publicUrl}/api/rooms/events?token=${token}`)
    es.onmessage = parseCallbackFn

    SOURCE_EVENTS.forEach((sourceEvent) => {
      es.addEventListener(sourceEvent, parseCallbackFn)
    })

    es.onerror = (err) => {
      console.log(err)
    }

    return () => {
      es.close()

      SOURCE_EVENTS.forEach((sourceEvent) => {
        es.removeEventListener(sourceEvent, parseCallbackFn)
      })
    }
  }, [session?.access_token, session?.publicUrl])
}
