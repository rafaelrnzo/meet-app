import { useEffect, useRef, useState } from 'react'
import type { ActiveRoom } from '@/lib/api/admin-api'

import Cookies from 'js-cookie'

export type RoomEventType =
  | 'connected'
  | 'room_updated'
  | 'participant_joined'
  | 'participant_left'
  | 'recording_started'
  | 'recording_stopped'
  | 'ping'

export type RoomSSEEvent = {
  type: RoomEventType
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

export type RoomEventConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

type UseRealTimeRoomsOptions = {
  roomCode?: string
}

const REFRESH_EVENT_TYPES: RoomEventType[] = [
  'room_updated',
  'participant_joined',
  'participant_left',
  'recording_started',
  'recording_stopped',
]

// All named event types the backend may send as SSE `event:` fields
const ALL_NAMED_EVENT_TYPES: RoomEventType[] = [
  'connected',
  'room_updated',
  'participant_joined',
  'participant_left',
  'recording_started',
  'recording_stopped',
  'ping',
]

export function applyRoomEventToActiveRooms(
  activeRooms: ActiveRoom[],
  event: RoomSSEEvent
): ActiveRoom[] {
  const roomName = event.data?.room_id
  if (!roomName) return activeRooms

  const participantCount = event.data?.participant_count ?? event.data?.participants ?? 0
  const isRoomStateEvent =
    event.type === 'participant_joined' ||
    event.type === 'participant_left' ||
    event.type === 'room_updated'

  if (!isRoomStateEvent || typeof participantCount !== 'number') {
    return activeRooms
  }

  const existingRoom = activeRooms.find((room) => room.name === roomName)

  if (event.type === 'room_updated' && typeof event.data?.is_live !== 'boolean') {
    return activeRooms
  }

  if (participantCount <= 0) {
    return activeRooms.filter((room) => room.name !== roomName)
  }

  if (existingRoom) {
    return activeRooms.map((room) =>
      room.name === roomName ? { ...room, num_participants: participantCount } : room
    )
  }

  return [
    ...activeRooms,
    {
      sid: roomName,
      name: roomName,
      num_publishers: 0,
      num_participants: participantCount,
      creation_time: Math.floor(Date.now() / 1000),
    },
  ]
}

/**
 * Handles a parsed SSE event — updates status and fires the onUpdate callback.
 */
function handleParsedEvent(
  data: RoomSSEEvent,
  setStatus: (s: RoomEventConnectionStatus) => void,
  setLastEvent: (e: RoomSSEEvent) => void,
  onUpdateRef: React.MutableRefObject<((event: RoomSSEEvent) => void) | undefined>
) {
  setLastEvent(data)

  if (data.type === 'connected') {
    setStatus('connected')
    return
  }

  if (data.type === 'ping') {
    return
  }

  if (REFRESH_EVENT_TYPES.includes(data.type)) {
    console.log('[SSE] Room event received:', data)
    onUpdateRef.current?.(data)
  }
}

/**
 * Hook to subscribe to real-time room updates via SSE.
 *
 * Handles both:
 *  - Named SSE events (event: room_updated\ndata:...) via addEventListener
 *  - Unnamed/default SSE events (data:...) via onmessage
 *
 * @param onUpdate Callback function to trigger when an update is received.
 */
export function useRealTimeRooms(
  onUpdate?: (event: RoomSSEEvent) => void,
  options: UseRealTimeRoomsOptions = {}
) {
  const [status, setStatus] = useState<RoomEventConnectionStatus>('idle')
  const [lastEvent, setLastEvent] = useState<RoomSSEEvent | null>(null)
  const [error, setError] = useState<Event | null>(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    // SSE for real-time updates — token passed as query param because
    // EventSource does not support custom headers.
    const token =
      typeof window !== 'undefined'
        ? Cookies.get('token') ||
          Cookies.get('vc_token') ||
          Cookies.get('access_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('vc_token') ||
          localStorage.getItem('access_token')
        : null

    if (!token) {
      setStatus('idle')
      return
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || 'http://localhost:8080'
    const params = new URLSearchParams({ token })
    if (options.roomCode) {
      params.set('room_code', options.roomCode)
    }

    setStatus('connecting')
    setError(null)
    const eventSource = new EventSource(`${baseUrl}/api/rooms/events?${params.toString()}`)

    // ─── Handle unnamed/default SSE events (data: {...}) ───────────────────
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RoomSSEEvent
        handleParsedEvent(data, setStatus, setLastEvent, onUpdateRef)
      } catch (err) {
        console.error('[SSE] Failed to parse room event (onmessage):', err, event.data)
      }
    }

    // ─── Handle named SSE events (event: room_updated\ndata: {...}) ─────────
    // Backend may send `event: <type>` headers — onmessage won't fire for these.
    ALL_NAMED_EVENT_TYPES.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const raw = JSON.parse((event as MessageEvent).data)
          // Normalise: backend may send {type, data} or just the data payload directly
          const data: RoomSSEEvent =
            raw?.type ? raw : { type: eventType, data: raw }
          handleParsedEvent(data, setStatus, setLastEvent, onUpdateRef)
        } catch (err) {
          console.error(`[SSE] Failed to parse named event "${eventType}":`, err)
        }
      })
    })

    eventSource.onopen = () => {
      setStatus('connected')
      console.log('[SSE] Connected to room events')
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] EventSource failed:', error)
      setError(error)
      setStatus('disconnected')
      eventSource.close()
    }

    return () => {
      console.log('[SSE] Disconnecting...')
      eventSource.close()
      setStatus('disconnected')
    }
  }, [options.roomCode])

  return { status, lastEvent, error }
}
