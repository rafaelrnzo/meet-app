'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { qstring } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'

export interface HostMessage {
  status: string
  participantName: string
  participants: { participantId: string; participantName: string }[]
}

export function useParticipantWaitingList(toaster = false) {
  const { data: session } = useSession()
  const { name: roomCode } = useParams<{ name: string }>()
  const [participantPending, setParticipantPending] = useState<HostMessage['participants']>([])
  const isAdmin = session?.profile.role.name === 'admin'
  const toastIdRef = useRef<string | number>(0)

  useEffect(() => {
    if (!roomCode || !session?.access_token || !isAdmin) return

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

        setParticipantPending(() => {
          if (!pending.length) {
            toast.dismiss('participant-waiting')
          }

          return pending
        })

        if (toaster) {
          toastIdRef.current = toast.base(`${pending.length} orang meminta untuk bergabung`, {
            duration: Infinity,
            position: 'top-center',
            id: 'participant-waiting',
          })
        }
      } catch (err) {
        console.error('Gagal memproses data dari SSE:', err)
      }
    }

    return () => es.close()
  }, [isAdmin, roomCode, session?.access_token, toaster])

  return {
    participantPending,
    setParticipantPending,
  }
}
