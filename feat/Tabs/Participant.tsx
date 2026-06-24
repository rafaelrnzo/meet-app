'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParticipants } from '@livekit/components-react'
import { qstring } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { acceptOrDeniedParticipant } from '@/feat/api'
import { useParams } from 'next/navigation'

interface HostMessage {
  status: string
  participantName: string
  participants: { participantId: string; participantName: string }[]
}

export const TabsParticipant: FC = () => {
  const { name: roomName } = useParams<{ name: string }>()
  const [loadingId, setLoadingId] = useState<string[]>([])
  const [pending, setPending] = useState<HostMessage['participants']>([])
  const { data: session } = useSession()
  const mergedParticipant = useParticipants()

  // Host UI
  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '') + '/api/waiting-rooms/hosts'
    const es = new EventSource(
      qstring(url, { room_code: roomName, token: session?.access_token }, { skipEmpty: true })
    )

    es.onmessage = (e: MessageEvent<string>) => {
      const { status, participants: pending }: HostMessage = JSON.parse(e.data)
      const triggerEvents = ['initial-waiting', 'waiting', 'waiting-updated']

      if (!triggerEvents.includes(status)) {
        return
      }

      setPending(pending)
    }

    return () => es.close()
  }, [roomName, session?.access_token])

  async function handleParticipant(action: 'accept' | 'reject', participantId: string) {
    try {
      setLoadingId((prev) => [...prev, participantId])
      await acceptOrDeniedParticipant({
        action,
        roomName,
        identity: participantId,
      })
    } catch (e) {
      console.log('Failed to accept/reject:', e)
    } finally {
      setLoadingId((prev) => prev.filter((id) => id !== participantId))
    }
  }

  return (
    <div>
      {!!pending.length && (
        <div>
          <h3>Pending</h3>
          <ul>
            {pending.map(({ participantId, participantName }) => (
              <li key={participantId} className='flex items-center justify-between'>
                <p>{participantName}</p>
                <button
                  className='text-destructive disabled:opacity-40'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('reject', participantId)}
                >
                  Tolak
                </button>
                <button
                  className='disabled:opacity-40'
                  disabled={loadingId.includes(participantId)}
                  onClick={() => handleParticipant('accept', participantId)}
                >
                  Terima
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3>Semua</h3>
        <ul>
          {mergedParticipant.map(({ identity, ...participant }) => (
            <li key={identity}>
              <p>{participant.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
