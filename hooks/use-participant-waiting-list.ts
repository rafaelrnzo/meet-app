'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { qstring } from '@/lib/utils'

export interface HostMessage {
  status: string
  participantName: string
  participants: { participantId: string; participantName: string }[]
}

export function useParticipantWaitingList() {
  const { data: session } = useSession()
  const { name: roomCode } = useParams<{ name: string }>()
  const [participantPending, setParticipantPending] = useState<HostMessage['participants']>([])

  useEffect(() => {
    if (!roomCode || !session?.access_token) return

    const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '') + '/api/waiting-rooms/hosts'
    const url = qstring(
      baseUrl,
      { room_code: roomCode, token: session?.access_token },
      { skipEmpty: true }
    )

    const es = new EventSource(url)

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const { status, participants: pending }: HostMessage = JSON.parse(e.data)
        const triggerEvents = ['initial-waiting', 'waiting', 'waiting-updated']

        if (!triggerEvents.includes(status) || !pending) return

        setParticipantPending(pending)
      } catch (err) {
        console.error('Gagal memproses data dari SSE:', err)
      }
    }

    return () => es.close()
  }, [roomCode, session?.access_token])

  return {
    participantPending,
    setParticipantPending,
  }
}
