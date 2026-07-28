'use client'

import type { DbRoom } from '@/lib/api/admin-api'
import type { RoomSSEDTO } from '@/feat/rooms/dto'
import { useCallback, useEffect, useState } from 'react'
import { useRoomInfo } from '@livekit/components-react'
import { djs, qstring } from '@/lib/utils'
import { fetchUserDbRooms } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { RoomSSEEvent } from '@/feat/rooms/dto'

function useTabsSettingRooms() {
  const { token, publicUrl } = useAuth()
  const { name: currentRoomCode } = useRoomInfo()
  const [rooms, setRooms] = useState<DbRoom[]>([])

  const getAllRooms = useCallback(async () => {
    try {
      const response = await fetchUserDbRooms({ sort: 'newest' })
      const otherRooms = response.filter(
        ({ end_date, room_code }) => djs().isBefore(end_date) && room_code !== currentRoomCode
      )
      setRooms(otherRooms)
    } catch {
      setRooms([])
    }
  }, [currentRoomCode])

  useEffect(() => {
    getAllRooms()
  }, [getAllRooms])

  useEventSource<RoomSSEDTO>({
    eventUrl: qstring(`${publicUrl}/api/rooms/events`, { token }),
    onMessage: (event) => {
      if (
        [
          RoomSSEEvent.ParticipantJoined,
          RoomSSEEvent.ParticipantLeft, // TODO: pastikan apakah ini perlu
          RoomSSEEvent.RoomUpdated, // TODO: pastikan apakah ini perlu
        ].includes(event.type)
      ) {
        getAllRooms()
      }
    },
  })

  return { rooms }
}

export { useTabsSettingRooms }
