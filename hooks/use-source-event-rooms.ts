import { useEffectEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type SourceEventParams = {
  type: string
  data?: {
    id?: number
    room_id?: string
    room_code?: string
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
  eventDeps: string[],
  eventPath = '/api/rooms/events'
) {
  const callbackEvent = useEffectEvent(callbackFn)
  const { data: session } = useSession()
  const eventKey = eventDeps.join('|')

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

    if (!publicUrl || !token) {
      return
    }

    const es = new EventSource(`${publicUrl}${eventPath}?token=${token}`)
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
  }, [session?.access_token, session?.publicUrl, eventKey, eventPath])
}
