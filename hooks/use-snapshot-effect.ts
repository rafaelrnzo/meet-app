import { useEffect, useEffectEvent } from 'react'
import { useDataChannel } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'

export function useSnapshotEffect<T = unknown>(data: T, onMessage?: (payload: T) => void) {
  const { screen, isHost } = useRoomState()
  const { send: replySnapshot } = useDataChannel<T>(LiveKitAction.SnapshotReply, ({ payload }) => {
    // Listen reply
    if (!isHost && payload) {
      onMessage?.(payload)
    }
  })

  const { send: requestSnapshot } = useDataChannel<number>(
    LiveKitAction.SnapshotRequest,
    ({ participant }) => {
      // Listen request
      if (isHost) {
        replySnapshot(data, {
          reliable: true,
          destinationIdentities: [participant.identity],
        })
      }
    }
  )

  const checkSnapshot = useEffectEvent(() => {
    if (screen && !isHost) {
      requestSnapshot(screen.id, { reliable: true, destinationIdentities: [screen.host] })
    }
  })

  useEffect(() => checkSnapshot(), [])
}
