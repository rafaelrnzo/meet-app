'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchDbRooms, fetchActiveRooms, fetchUserDbRooms } from '@/lib/api/admin-api'
import type { DbRoom, ActiveRoom, RoomParams } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { RoomList } from '@/components/features/rooms/RoomList'
import { djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader } from 'lucide-react'
import { applyRoomEventToActiveRooms, useRealTimeRooms } from '@/hooks/use-real-time-rooms'
import { handleSearchNotFound, joinRoomAction } from '@/feat/rooms/helper'

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
  const [queryParams, setQueryParams] = useState<RoomParams>({})
  const [isEmptyRoomCode, setIsEmptyRoomCode] = useState(false)

  const loadData = useCallback(
    async (params?: RoomParams) => {
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
        setTimeout(() => setLoading(false), 500)
      }
    },
    [isAdmin]
  )

  // SSE for real-time updates
  useRealTimeRooms((event) => {
    setActiveRooms((current) => applyRoomEventToActiveRooms(current, event))
    if (event.type !== 'participant_joined' && event.type !== 'participant_left') {
      loadData()
    }
  })

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, loadData])

  const displayedRooms = (isAdmin ? dbRooms : dbUserRooms).filter(({ end_date }) =>
    djs().isBefore(end_date)
  )

  useEffect(() => {
    handleSearchNotFound({ search: queryParams.search, countData: displayedRooms.length })
  }, [displayedRooms.length, queryParams.search])

  return (
    <PageContainer
      icon='room'
      title='Beranda'
      subTitle='Bergabung dalam ruangan secara instan'
      backToTopButton
      insertAfterTitle={
        <div className='flex gap-2 max-md:w-full max-md:flex-col md:items-center'>
          <Input
            className='aria-invalid:text-error w-full bg-white aria-invalid:border-red-200 aria-invalid:bg-red-200 md:w-87.5'
            placeholder='Masukkan kode ruangan di sini ...'
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            aria-invalid={isEmptyRoomCode && !roomCodeInput.trim().length}
          />
          <Button
            onClick={() =>
              startTransitionJoin(async () => {
                await joinRoomAction({
                  code: roomCodeInput,
                  setIsEmptyRoomCode,
                  onSuccess: (code) => router.push(`/meeting/${encodeURIComponent(code)}`),
                })
              })
            }
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
            placeholder: 'Cari ruangan',
            onSearch: (search) => {
              const updatedParams = { ...queryParams, search }
              setQueryParams(updatedParams)
              loadData(updatedParams)
            },
            'aria-invalid': !!queryParams.search && !displayedRooms.length,
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
