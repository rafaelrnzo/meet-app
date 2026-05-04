import { useEffect } from 'react'

/**
 * Hook to subscribe to real-time room updates via SSE.
 * @param onUpdate Callback function to trigger when an update is received.
 */
export function useRealTimeRooms(onUpdate: () => void) {
  useEffect(() => {
    // SSE for real-time updates
    const token = typeof window !== 'undefined' ? localStorage.getItem('vc_token') : null
    if (!token) return

    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') || 'http://localhost:8080'
    const eventSource = new EventSource(`${baseUrl}/api/rooms/events?token=${token}`)

    eventSource.onmessage = (event) => {
      if (event.data === 'rooms_updated' || event.data === 'recordings_updated') {
        console.log('[SSE] Updates received, refreshing data...')
        onUpdate()
      }
    }

    eventSource.onopen = () => {
      console.log('[SSE] Connected to room events')
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] EventSource failed:', error)
      eventSource.close()
    }

    return () => {
      console.log('[SSE] Disconnecting...')
      eventSource.close()
    }
  }, [onUpdate])
}
