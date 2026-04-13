'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, LayoutGrid, RefreshCcw, Calendar, Users, Copy } from 'lucide-react'
import {
  fetchDbRooms,
  fetchActiveRooms,
  type DbRoom,
  type ActiveRoom,
  fetchUserDbRooms,
} from '@/lib/api/admin-api'
import { cn } from '@/lib/utils'
import { useAuth } from '../../hooks/use-auth'

export default function HomePage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
  const [dbUserRooms, setUserDbRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, isAdmin])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!isAdmin) {
        const [dbData, liveData] = await Promise.allSettled([
          fetchUserDbRooms(),
          fetchActiveRooms(),
        ])
        if (dbData.status === 'fulfilled') setUserDbRooms(dbData.value || [])
        if (liveData.status === 'fulfilled') setActiveRooms(liveData.value || [])
      } else {
        const [dbData, liveData] = await Promise.allSettled([fetchDbRooms(), fetchActiveRooms()])
        if (dbData.status === 'fulfilled') setDbRooms(dbData.value || [])
        if (liveData.status === 'fulfilled') setActiveRooms(liveData.value || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = (code?: string) => {
    const targetCode = typeof code === 'string' ? code : roomCodeInput
    if (!targetCode.trim()) return
    router.push(`/meeting/${encodeURIComponent(targetCode)}`)
  }

  const displayedRooms = (isAdmin ? dbRooms : dbUserRooms).map((room) => ({
    ...room,
    isLive: !!activeRooms.find((ar) => ar.name === room.room_code),
    currentParticipants:
      activeRooms.find((ar) => ar.name === room.room_code)?.num_participants || 0,
  }))

  return (
    <div className='space-y-6'>
      <div className='bg-card border-border flex flex-col items-center gap-6 rounded-lg border p-6 shadow-sm md:flex-row'>
        <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
          <Video className='text-primary h-5 w-5' />
        </div>
        <div className='flex-1 text-center md:text-left'>
          <h2 className='text-base font-semibold'>Quick Join</h2>
          <p className='text-muted-foreground mt-1 text-xs'>
            Join an existing meeting instantly with a code.
          </p>
        </div>
        <div className='flex w-full gap-2 md:w-auto'>
          <Input
            className='h-9 font-mono text-sm'
            placeholder='Enter room code...'
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <Button onClick={() => handleJoin()} className='h-9'>
            Join
          </Button>
        </div>
      </div>

      <div>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='flex items-center gap-2 text-sm font-semibold'>
            <LayoutGrid className='text-muted-foreground h-4 w-4' /> Available Rooms
          </h3>
          <Button variant='outline' size='sm' onClick={loadData} className='h-8 text-xs'>
            <RefreshCcw className='mr-2 h-3 w-3' /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className='text-muted-foreground py-12 text-center text-sm'>Loading rooms...</div>
        ) : displayedRooms.length === 0 ? (
          <div className='border-border bg-muted/30 rounded-lg border border-dashed py-12 text-center'>
            <p className='text-muted-foreground text-sm'>No rooms available at the moment.</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {displayedRooms.map((room) => {
              const now = new Date()
              const start = new Date(room.start_date)
              const end = new Date(room.end_date)
              const status = now < start ? 'upcoming' : now > end ? 'ended' : 'open'
              const isFull = room.currentParticipants >= room.max_participants

              return (
                <div
                  key={room.id}
                  className='group bg-card border-border hover:border-primary/50 relative rounded-lg border p-4 transition-all'
                >
                  {room.isLive && (
                    <span
                      className='absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-red-500'
                      title='Live'
                    />
                  )}

                  <div className='mb-3'>
                    <h4 className='truncate pr-6 text-sm font-semibold'>{room.name}</h4>
                    <p className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                      {room.description || 'No description'}
                    </p>
                  </div>

                  <div className='bg-muted border-border mb-3 flex items-center justify-between rounded border px-3 py-2'>
                    <code className='text-primary font-mono text-xs font-medium'>
                      {room.room_code}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(room.room_code)}
                      className='text-muted-foreground hover:text-foreground'
                    >
                      <Copy className='h-3 w-3' />
                    </button>
                  </div>

                  <div className='text-muted-foreground mb-4 flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='h-3 w-3' /> {start.toLocaleDateString()}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Users className='h-3 w-3' /> {room.currentParticipants}/
                      {room.max_participants}
                    </div>
                  </div>

                  <Button
                    className={cn(
                      'h-8 w-full text-xs font-medium',
                      status === 'open' && !isFull
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed'
                    )}
                    disabled={status !== 'open' || isFull}
                    onClick={() => handleJoin(room.room_code)}
                  >
                    {status === 'ended'
                      ? 'Ended'
                      : status === 'upcoming'
                        ? 'Scheduled'
                        : isFull
                          ? 'Full'
                          : 'Enter Room'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
