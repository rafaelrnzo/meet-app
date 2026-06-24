import type {
  DataPacket_Kind,
  DataPublishOptions,
  Encryption_Type,
  RemoteParticipant,
} from 'livekit-client'
import type { LiveKitAction } from '@/feat/enum'
import { useEffect, useEffectEvent, useState } from 'react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { decoder, encoder, loginfo } from '@/lib/utils'

export function useDataChannel<P>(
  action: LiveKitAction,
  onMessage: (arg: { payload?: P; participant: RemoteParticipant }) => void
) {
  const room = useRoomContext()
  const [message, setMessage] = useState<P>()

  const handleData = useEffectEvent(
    (
      data: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      _topic?: string,
      _encryptionType?: Encryption_Type
    ) => {
      try {
        const rawString = decoder.decode(data)

        // Invalid json parse
        if (!rawString.trim().startsWith('{')) {
          return
        }

        const { action: current, payload } = JSON.parse(decoder.decode(data)) as {
          action: LiveKitAction
          payload: P
        }

        if (!participant) return

        if (current === action) {
          loginfo(`Receiving action "${action}"`, payload)
          onMessage({ payload, participant })
        }
      } catch (e) {
        console.log('Failed to receive the message:', e)
      }
    }
  )

  const send = (payload?: P, options?: DataPublishOptions) => {
    if (room.state !== ConnectionState.Connected) return
    setMessage(payload)

    loginfo(`Requesting action "${action}"`, payload)
    room.localParticipant.publishData(encoder.encode(JSON.stringify({ action, payload })), options)
  }

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  return { message, send }
}
