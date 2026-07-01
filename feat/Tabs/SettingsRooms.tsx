'use client'

import type { FC } from 'react'
import type { ActiveRoom, DbRoom } from '@/lib/api/admin-api'
import type { RoomSSEDTO } from '@/feat/rooms/dto'
import { useEffect, useState } from 'react'
import { useRoomInfo } from '@livekit/components-react'
import { cn, djs, qstring } from '@/lib/utils'
import { fetchActiveRooms, fetchUserDbRooms } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { RoomSSEEvent } from '@/feat/rooms/dto'
import { Icon } from '@/components/ui/icon'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const TabsSettingsRooms: FC = () => {
  const { token, publicUrl } = useAuth()
  const { name: currentRoomCode } = useRoomInfo()
  const [allRooms, setAllRooms] = useState<(DbRoom & { num_participants?: number })[]>([])
  const [liveRooms, setLiveRooms] = useState<ActiveRoom[]>([])

  const getAllRooms = async () => {
    try {
      const response = await fetchUserDbRooms({ sort: 'newest' })
      const anotherActiveRooms = response.filter(
        ({ end_date, room_code }) => djs().isBefore(end_date) && room_code !== currentRoomCode
      )
      const roomWithParticipant = anotherActiveRooms.map((room) => ({
        ...room,
        num_participants: 0,
      }))
      setAllRooms(roomWithParticipant)
    } catch {
      setAllRooms([])
    }
  }

  const getAllLiveRooms = async () => {
    try {
      const response = await fetchActiveRooms()
      setLiveRooms(response)
    } catch {
      setLiveRooms([])
    }
  }

  useEffect(() => {
    getAllRooms()
    getAllLiveRooms()
  }, []) //eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const liveRoomMap = new Map(
      liveRooms.map((liveRoom) => [liveRoom.name, liveRoom.num_participants])
    )

    setAllRooms((prev) =>
      prev.map((room) => ({
        ...room,
        num_participants: liveRoomMap.get(room.room_code) ?? 0,
      }))
    )
  }, [liveRooms])

  // TODO
  // ISSUE: ketika pertama kali user join, room sudah terbaca live tapi tidak ada key `num_participant` di response.
  // ketika di reload/ user lain join, participant langsung berubah jadi 2
  // admin masih terhitung sebagai participant
  useEventSource<RoomSSEDTO>({
    eventUrl: qstring(`${publicUrl}/api/rooms/events`, { token }),
    onMessage: (event) => {
      if (event.type === RoomSSEEvent.RoomUpdated) {
        getAllRooms()
      }
      if ([RoomSSEEvent.ParticipantJoined, RoomSSEEvent.ParticipantLeft].includes(event.type)) {
        getAllLiveRooms()
      }
    },
  })

  return (
    <div className='space-y-4'>
      {allRooms.map((room) => (
        <Card
          className={cn('flex flex-col space-y-4 rounded-md border-neutral-200 p-5')}
          key={room.room_code}
        >
          <CardHeader className='relative grow gap-4 space-y-0 p-0'>
            <div className='flex flex-wrap items-center justify-between'>
              <CardTitle className='mb-0 min-w-1/2 flex-1 truncate text-base font-semibold text-red-800'>
                {room.name}
              </CardTitle>
              <div className='flex items-center gap-2'>
                {room.group?.name && (
                  <Badge
                    variant='outline'
                    className='bg-green-50 wrap-anywhere text-neutral-950 not-italic'
                  >
                    {room.group.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className='flex items-center justify-between gap-2 text-sm'>
              <div className='flex items-center gap-2'>
                <Icon type='calendar' className='text-neutral-400' />
                {`${djs(room.start_date).format('DD MMMM YYYY, HH.mm')} WIB`}
              </div>
              <div className='flex items-center gap-2'>
                <Icon type='users' className='text-neutral-400' />
                <span>
                  {room.num_participants ?? 0}/{room.max_participants ?? 0}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
