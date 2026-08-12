'use client'

import type { FC } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { djs } from '@/lib/utils'
import { fetchUserDbRooms } from '@/lib/api/admin-api'
import { useSourceEventRooms } from '@/hooks'
import { default as NoData } from '@/components/ui/no-data'
import { RoomListHeader } from '@/components/features/rooms/RoomListHeader'
import { RoomList } from '@/components/features/rooms/RoomList'

interface HomeClientProps {
  rooms: DbRoom[]
  isAdmin: boolean
  isEmpty: boolean
  isInvalid: boolean
  canShareLink: boolean
}

const ROOM_COUNT_EVENTS = ['room_updated']

export const HomeClient: FC<HomeClientProps> = ({
  rooms,
  isAdmin,
  isEmpty,
  isInvalid,
  canShareLink,
}) => {
  const searchParams = useSearchParams()
  const [roomState, setRoomState] = useState(rooms)

  useEffect(() => {
    setRoomState(rooms)
  }, [rooms])

  async function refreshRooms() {
    const nextRooms = await fetchUserDbRooms(Object.fromEntries(searchParams))
    setRoomState(nextRooms.filter((room) => djs(room.end_date).isAfter(djs())))
  }

  useSourceEventRooms((event) => {
    if (event.type !== 'room_updated') return

    void refreshRooms()
    setRoomState((prev) =>
      prev.map((room) => {
        const sameRoom =
          room.id === event.data?.id ||
          room.room_code === event.data?.room_code ||
          room.room_code === event.data?.room_id

        return sameRoom ? { ...room, participants: event.data?.participants ?? 0 } : room
      })
    )
  }, ROOM_COUNT_EVENTS, '/admin/rooms/events')

  return (
    <>
      {isEmpty ? (
        <NoData
          title='Tidak Ada Ruangan yang Tersedia'
          desc='Silakan buat ruangan baru.'
          className='mt-[min(20vh,200px)]'
        />
      ) : (
        <RoomListHeader isInvalid={isInvalid} headerAddon={`${roomState.length} Daftar Ruangan`} />
      )}
      <RoomList rooms={roomState} isAdmin={isAdmin} canShareLink={canShareLink} />
    </>
  )
}
