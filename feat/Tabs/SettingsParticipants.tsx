'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParticipants, useRoomContext } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { fetchMemberRoom, fetchRoomByCode } from '@/lib/api/admin-api'
import { ParticipantAttribute } from '@/feat/enum'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Participant {
  id: string
  name: string
  role: string
  status?: 'banned' | 'waiting' | 'idle'
}

export const TabsSettingsParticipants: FC = () => {
  const participants = useParticipants()
  const [roomMember, setRoomMember] = useState<Participant[]>([])
  const room = useRoomContext()

  useEffect(() => {
    async function getRoomMember() {
      try {
        const { id } = await fetchRoomByCode(room.name)
        if (!id) throw new Error()
        const response = await fetchMemberRoom({ roomId: id })
        setRoomMember(
          response.map((user) => ({
            id: String(user.id),
            name: user.username,
            role: user.role.name,
            status: user.room_presence,
          }))
        )
      } catch {
        setRoomMember([])
      }
    }

    getRoomMember()
  }, [room, room.name])

  const activeParticipant: Participant[] = participants.map((user) => ({
    id: user.sid,
    name: user.name ?? '-',
    role: user.attributes?.[ParticipantAttribute.RoleName],
  }))
  const bannedWaitingParticipant = roomMember.filter((user) =>
    ['banned', 'waiting'].includes(user.status ?? '')
  )

  return (
    <div className='space-y-5'>
      {[...activeParticipant, ...bannedWaitingParticipant].map(({ id, name, role, status }) => {
        const avatarName = name?.substring(0, 2).toUpperCase() ?? ''
        return (
          <div className='flex items-center gap-2.5' key={id}>
            <Avatar size='lg'>
              <AvatarFallback>{avatarName}</AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium text-red-800'>{name}</div>
              <div className='flex gap-1 text-xs text-neutral-400'>
                <span className='capitalize'>{role === 'user' ? 'peserta' : role}</span>
                {status && ['banned', 'waiting'].includes(status) && (
                  <>
                    |
                    <span className={cn(status === 'banned' && 'text-error', 'capitalize')}>
                      {status === 'banned' ? 'diblokir' : 'menunggu persetujuan'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
