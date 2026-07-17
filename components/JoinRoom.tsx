'use client'

import type { FC } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import { useState } from 'react'
import { useJoinRoom } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface JoinRoomProps {
  rooms: DbRoom[]
}

export const JoinRoom: FC<JoinRoomProps> = ({ rooms }) => {
  const [queryRoom, setQueryRoom] = useState('')
  const { joinRoom } = useJoinRoom()
  const encodedQuery = encodeURIComponent(queryRoom.trim())
  const room = rooms.find((room) => `${room.room_code}` === encodedQuery)
  const disabled = !room || !queryRoom.trim().length

  return (
    <div className='flex items-center gap-2 max-lg:w-full max-md:flex-col'>
      <Input
        className='aria-invalid:text-error w-full bg-white aria-invalid:border-red-200 aria-invalid:bg-red-200 lg:w-64 xl:w-87.5'
        placeholder='Masukkan kode ruangan di sini ...'
        value={queryRoom}
        onChange={(e) => setQueryRoom(e.target.value)}
      />
      <Button
        className='max-md:w-full'
        onClick={() => joinRoom(queryRoom.trim())}
        variant='primary'
        disabled={disabled}
      >
        Gabung Ruangan
      </Button>
    </div>
  )
}
