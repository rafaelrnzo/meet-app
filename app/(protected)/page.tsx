'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  fetchDbRooms,
  fetchActiveRooms,
  fetchUserDbRooms,
  fetchRoomByCode,
} from '@/lib/api/admin-api'
import type { DbRoom, ActiveRoom } from '@/lib/api/admin-api'
import { useAuth } from '../../hooks/use-auth'
import { RoomList } from '@/components/features/rooms/RoomList'
import { djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'
import { useRealTimeRooms } from '../../hooks/use-real-time-rooms'

export default function HomePage() {
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAuth()
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [dbRooms, setDbRooms] = useState<DbRoom[]>([])
  const [dbUserRooms, setUserDbRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [isPendingJoin, startTransitionJoin] = useTransition()
  const isMobile = useIsMobile()

  const loadData = useCallback(
    async (params?: { search?: string }) => {
      setLoading(true)
      try {
        if (!isAdmin) {
          const [dbData, liveData] = await Promise.allSettled([
            fetchUserDbRooms({ ...params }),
            fetchActiveRooms(),
          ])
          if (dbData.status === 'fulfilled') setUserDbRooms(dbData.value || [])
          if (liveData.status === 'fulfilled') setActiveRooms(liveData.value || [])
        } else {
          const [dbData, liveData] = await Promise.allSettled([
            fetchDbRooms({ ...params }),
            fetchActiveRooms(),
          ])
          if (dbData.status === 'fulfilled') setDbRooms(dbData.value || [])
          if (liveData.status === 'fulfilled') setActiveRooms(liveData.value || [])
        }
      } finally {
        setLoading(false)
      }
    },
    [isAdmin]
  )

  // SSE for real-time updates
  useRealTimeRooms(() => {
    loadData()
  })

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, loadData])

  const handleJoin = async (code: string) => {
    const targetCode = code.trim()
    if (!targetCode) return

    try {
      await fetchRoomByCode(targetCode)
      startTransitionJoin(() => {
        router.push(`/meeting/${encodeURIComponent(targetCode)}`)
      })
    } catch {
      toast.error('Kode ruangan salah', {
        description: `Kode '${targetCode}' tidak valid. Coba salin kode ruang lainnya.`,
      })
    }
  }

  const displayedRooms = (isAdmin ? dbRooms : dbUserRooms).filter(({ end_date }) =>
    djs().isBefore(end_date)
  )

  return (
    <PageContainer
      icon='room'
      title='Beranda'
      subTitle='Bergabung dalam ruangan secara instan'
      insertAfterTitle={
        <div className='flex gap-2 max-md:w-full max-md:flex-col md:items-center'>
          <Input
            className='w-full bg-white md:w-87.5'
            placeholder='Masukkan kode ruangan di sini ...'
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
          />
          <Button
            onClick={() => handleJoin(roomCodeInput)}
            variant='primary'
            disabled={isPendingJoin}
          >
            {isPendingJoin ? (
              <>
                <Loader className='animate-spin' /> Bergabung ...
              </>
            ) : (
              'Gabung Ruangan'
            )}
          </Button>
        </div>
      }
    >
      <div className='space-y-4 md:space-y-8'>
        <TableViewHeader
          search={{
            placeholder: 'Cari nama atau kode ruangan ...',
            onSearch: ({ value }) => loadData({ search: value }),
          }}
          {...(!isMobile && {
            headerAddon: (
              <span className='text-base font-semibold text-red-800 max-md:hidden'>
                {displayedRooms.length} Daftar Ruangan
              </span>
            ),
          })}
        />

        <RoomList
          loading={loading}
          staticRooms={displayedRooms}
          activeRooms={activeRooms}
          isAdmin={isAdmin}
        />
      </div>
    </PageContainer>
  )
}
