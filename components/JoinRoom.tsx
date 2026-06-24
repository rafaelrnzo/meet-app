'use client'

import type { FC } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const JoinRoom: FC<{ rooms: DbRoom[] }> = ({ rooms }) => {
  const [queryRoom, setQueryRoom] = useState('')
  const router = useRouter()
  const encodedQuery = encodeURIComponent(queryRoom.trim().toLowerCase())
  const room = rooms.find((room) => `${room.id}`.toLowerCase().startsWith(encodedQuery))
  const disabled = !room || !queryRoom.trim().length

  return (
    <div className='flex items-center gap-2 max-lg:w-full max-md:flex-col'>
      <Input
        className='aria-invalid:text-error w-full bg-white aria-invalid:border-red-200 aria-invalid:bg-red-200 lg:w-64 xl:w-87.5'
        placeholder='Masukkan kode ruangan di sini ...'
        value={queryRoom}
        onChange={(e) => setQueryRoom(e.target.value)}
        aria-invalid={disabled}
      />
      <Button
        className='max-md:w-full'
        onClick={() => router.push(`/rooms/${encodedQuery}`)}
        variant='primary'
        disabled={disabled}
      >
        Gabung Ruangan
      </Button>
    </div>
  )
}
