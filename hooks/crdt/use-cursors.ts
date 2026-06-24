import type { AwarenessState, LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'
import { useEffect, useState } from 'react'

export type RemoteCursor = AwarenessState & { clientId: number }

export function useCursors(provider: LiveKitYjsProvider) {
  const localClientId = provider.awareness.clientID
  const [cursors, setCursors] = useState<RemoteCursor[]>([])

  useEffect(() => {
    const update = () => {
      const next: RemoteCursor[] = []
      provider.awareness.getStates().forEach((state, clientId) => {
        // Skip local cursor — No need to render self cursor
        if (clientId === localClientId) return
        if (!state?.cursor) return
        next.push({ clientId, ...(state as AwarenessState) })
      })

      setCursors(next)
    }

    provider.awareness.on('change', update)
    return () => provider.awareness.off('change', update)
  }, [provider, localClientId])

  return cursors
}
