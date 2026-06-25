'use client'

import type { FC } from 'react'
import type { Recording } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { fetchRecordings, fetchRoomByCode } from '@/lib/api/admin-api'

export const TabsSettingsRecordings: FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const room = useRoomContext()

  useEffect(() => {
    async function getAllRecording() {
      try {
        const { id } = await fetchRoomByCode(room.name)
        if (!id) throw new Error()
        const response = await fetchRecordings({ room_id: `${id}` }) // TODO: belum ada durasi rekaman
        setRecordings(response)
      } catch {
        setRecordings([])
      }
    }

    getAllRecording()
  }, [room.name])

  return (
    <div className='space-y-4'>
      {recordings.map(({ id, name }) => (
        <div key={id}>
          <div className='font-medium text-red-800'>{name}</div>
          <div className='text-xs text-neutral-400'>Durasi rekaman: 05:00</div>
        </div>
      ))}
    </div>
  )
}
