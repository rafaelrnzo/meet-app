'use client'
import { useParticipants } from '@livekit/components-react'

export function ParticipantsBar() {
  const participants = useParticipants()
  return (
    <div className='border-b border-neutral-800 px-3 py-1 text-xs text-neutral-400'>
      participants: {participants.length} → {participants.map((p) => p.identity).join(', ') || '—'}
    </div>
  )
}
