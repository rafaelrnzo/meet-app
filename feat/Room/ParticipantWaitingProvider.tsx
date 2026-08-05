'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { qstring } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'

export interface ParticipantPending {
  participantId: string
  participantName: string
}

export interface HostMessage {
  status: string
  participantName: string
  participants: ParticipantPending[]
}

interface ParticipantWaitingContextType {
  participantPending: ParticipantPending[]
  setParticipantPending: React.Dispatch<React.SetStateAction<ParticipantPending[]>>
}

const ParticipantWaitingContext = createContext<ParticipantWaitingContextType | null>(null)

export function ParticipantWaitingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { name: roomCode } = useParams<{ name: string }>()
  const [participantPending, setParticipantPending] = useState<ParticipantPending[]>([])
  const isAdmin = session?.profile.role.name === 'admin'

  useEffect(() => {
    if (!roomCode || !session?.access_token || !isAdmin) return

    const url = qstring(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/waiting-rooms/hosts`,
      {
        room_code: roomCode,
        token: session.access_token,
      },
      {
        skipEmpty: true,
      }
    )

    const es = new EventSource(url)

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const { status, participants }: HostMessage = JSON.parse(e.data)

        const triggerEvents = ['initial-waiting', 'waiting', 'waiting-updated']
        const triggerExpired = status === 'expired'

        if (triggerExpired) {
          setParticipantPending([])
          toast.dismiss('participant-waiting')
          return
        }

        if (!triggerEvents.includes(status) || !participants) {
          return
        }

        setParticipantPending(participants)

        if (!participants.length) {
          toast.dismiss('participant-waiting')
          return
        }

        toast.base(`${participants.length} orang meminta untuk bergabung`, {
          duration: 3000,
          position: 'top-center',
          id: 'participant-waiting',
        })
      } catch (err) {
        console.error('Gagal memproses data dari SSE:', err)
      }
    }

    return () => {
      es.close()
    }
  }, [roomCode, session?.access_token, isAdmin])

  return (
    <ParticipantWaitingContext.Provider
      value={{
        participantPending,
        setParticipantPending,
      }}
    >
      {children}
    </ParticipantWaitingContext.Provider>
  )
}

export function useParticipantWaiting() {
  const context = useContext(ParticipantWaitingContext)

  if (!context) {
    throw new Error('useParticipantWaitingList harus digunakan di dalam ParticipantWaitingProvider')
  }

  return context
}
