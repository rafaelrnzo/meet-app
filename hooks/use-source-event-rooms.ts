import { useEffectEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type SourceEventParams = {
  type: string
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

export function useSourceEventRooms(
  callbackFn: (event: SourceEventParams) => void,
  eventDeps: string[]
) {
  const callbackEvent = useEffectEvent(callbackFn)
  const { data: session } = useSession()

  const parseCallbackFn = useEffectEvent((event: MessageEvent<string>) => {
    try {
      const { type, data } = JSON.parse(event.data) as SourceEventParams
      if (!eventDeps.includes(type)) {
        return
      }
      callbackEvent({ type, data })
    } catch (err) {
      console.error('Failed to parse souce event rooms', err, event.data)
    }
  })

  useEffect(() => {
    const publicUrl = session?.publicUrl ?? ''
    const token = session?.access_token ?? ''

    if (!eventDeps.length) {
      return
    }

    const es = new EventSource(`${publicUrl}/api/rooms/events?token=${token}`)
    es.onmessage = parseCallbackFn

    eventDeps.forEach((sourceEvent) => {
      es.addEventListener(sourceEvent, parseCallbackFn)
    })

    es.onerror = () => {
      // Detect error here
    }

    return () => {
      es.close()

      eventDeps.forEach((sourceEvent) => {
        es.removeEventListener(sourceEvent, parseCallbackFn)
      })
    }
  }, [session?.access_token, session?.publicUrl, eventDeps])
}
