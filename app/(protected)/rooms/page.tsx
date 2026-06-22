'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchDbRooms, deleteDbRoom, fetchGroups, fetchActiveRooms } from '@/lib/api/admin-api'
import type { DbRoom, Group as GroupDto, ActiveRoom, RoomParams } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'
import { RoomList } from '@/components/features/rooms/RoomList'
import { cn, displayedError, djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { RoomForm } from '@/components/admin/RoomForm'
import { applyRoomEventToActiveRooms, useRealTimeRooms } from '@/hooks/use-real-time-rooms'
import type { SortRoomType } from '@/feat/rooms/dto'
import { SORT_ROOM } from '@/feat/rooms/dto'
import { handleSearchNotFound } from '@/feat/rooms/helper'
import { toast } from '@/components/ui/sonner'
import { Icon } from '@/components/ui/icon'
import { useIsMobile } from '@/hooks/use-mobile'
import NoData from '@/components/ui/no-data'

export default function RoomsPage() {
  const {
    hasPermission,
    isAdmin,
    loading: authLoading,
  } = useAuth({ requirePermission: 'module:rooms:access' })
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [loading, setLoading] = useState(false)
  const [queryParams, setQueryParams] = useState<RoomParams>({ sort: 'newest' })

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<DbRoom | null>(null)

  // Detail Sheet State
  const [selectedRoom, setSelectedRoom] = useState<DbRoom | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isModalDetail, setModalDetail] = useState(false)

  const canCreate = hasPermission('room:manage')
  const canDelete = isAdmin
  const canShareLink = hasPermission('room:share')
  const isMobile = useIsMobile()

  const loadData = useCallback(
    async (params?: RoomParams) => {
      setLoading(true)
      try {
        const [r, g, ar] = await Promise.allSettled([
          fetchDbRooms({ ...params }),
          isAdmin ? fetchGroups() : Promise.resolve([]),
          fetchActiveRooms(),
        ])
        if (r.status === 'fulfilled') setRooms(r.value || [])
        else console.error('Failed to load rooms:', r.reason)
        if (g.status === 'fulfilled') setGroups(g.value || [])
        else console.error('Failed to load groups:', g.reason)
        if (ar.status === 'fulfilled') setActiveRooms(ar.value || [])
        else console.error('Failed to load active rooms:', ar.reason)
      } catch (error) {
        console.error('Failed to load data', error)
      } finally {
        setLoading(false)
      }
    },
    [isAdmin]
  )

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, loadData])

  useRealTimeRooms((event) => {
    setActiveRooms((current) => applyRoomEventToActiveRooms(current, event))
    if (event.type !== 'participant_joined' && event.type !== 'participant_left') {
      loadData()
    }
  })

  const handleCreate = () => {
    setEditingRoom(null)
    setIsFormOpen(true)
  }

  const handleEdit = (room: DbRoom | null) => {
    setEditingRoom(room)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteDbRoom(id)
      loadData()
      toast.success('Ruang rapat berhasil dihapus', {
        description: `Ruang rapat "${selectedRoom?.name}" berhasil dihapus`,
      })
    } catch (error) {
      displayedError(error, 'Gagal menghapus ruang rapat')
    }
  }

  const handleViewDetails = (room: DbRoom) => {
    if (isMobile) {
      setSelectedRoom(room)
      setModalDetail(true)
      setIsDetailOpen(false)
    } else {
      setSelectedRoom(room)
      setIsDetailOpen(true)
    }
  }

  const getActiveRoomData = (roomName: string) => {
    return activeRooms.find((ar) => ar.name === roomName)
  }

  const displayedRooms = rooms.filter(({ end_date }) => djs().isBefore(end_date))
  const isSearchNotFound = !!queryParams.search && !displayedRooms.length

  const isTypeSort = (sort: string): sort is SortRoomType => {
    return !!sort && SORT_ROOM.some((item) => item === sort)
  }

  useEffect(() => {
    handleSearchNotFound({ search: queryParams.search, countData: displayedRooms.length })
  }, [displayedRooms.length, queryParams.search])

  return (
    <>
      {!queryParams.search && !displayedRooms.length && !loading ? (
        // height screen - header - padding
        <div className='flex min-h-[calc(100vh-48px-104px)] items-center justify-center md:min-h-[calc(100vh-56px-64px)]'>
          <NoData
            title='Tidak Ada Ruangan yang Tersedia'
            desc='Silakan buat ruangan baru.'
            insertButton={{
              children: (
                <>
                  <Icon type='plus' /> Buat Ruangan Baru
                </>
              ),
              onClick: () => setIsFormOpen(true),
            }}
          />
        </div>
      ) : (
        <PageContainer
          icon='room'
          title='Daftar Ruangan'
          subTitle='Kelola ruangan rapat untuk setiap kebutuhan rapat'
          backToTopButton
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
                'aria-invalid': isSearchNotFound,
              }}
              {...(canCreate && {
                add: {
                  onClick: handleCreate,
                  children: (
                    <>
                      <Icon type='plus' /> Tambah Ruangan
                    </>
                  ),
                },
              })}
              filter={{
                placeholder: 'Urut',
                options: [
                  {
                    value: 'newest',
                    label: 'Terbaru',
                  },
                  {
                    value: 'oldest',
                    label: 'Terlama',
                  },
                  {
                    value: 'name_asc',
                    label: 'Alfabet (A - Z)',
                  },
                  {
                    value: 'name_desc',
                    label: 'Alfabet (Z - A)',
                  },
                ],
                selectProps: {
                  select: {
                    value: queryParams.sort,
                    onValueChange: (value) => {
                      if (isTypeSort(value)) {
                        const updatedParams = { ...queryParams, sort: value }
                        setQueryParams(updatedParams)
                        loadData(updatedParams)
                      }
                    },
                  },
                },
              }}
              headerAddon={
                <span
                  className={cn(
                    'text-base font-semibold text-red-800',
                    !isSearchNotFound && 'hidden'
                  )}
                >
                  0 Daftar Ruangan
                </span>
              }
            />

            <RoomList
              loading={loading}
              staticRooms={displayedRooms}
              activeRooms={activeRooms}
              isAdmin={isAdmin}
              handleDetail={handleViewDetails}
              handleCloseModal={() => {
                setIsDetailOpen(false)
                if (isFormOpen && editingRoom) setIsFormOpen(false)
              }}
              canShareLink={canShareLink}
            />
          </div>

          <RoomDetailSheet
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            room={selectedRoom}
            activeRoom={selectedRoom ? getActiveRoomData(selectedRoom.room_code) : undefined}
            canDelete={canDelete}
            onDelete={handleDelete}
            onEditSuccess={loadData}
            handleEdit={(room: DbRoom | null) => handleEdit(room)}
            isModalDetail={isModalDetail}
            setModalDetail={setModalDetail}
          />
        </PageContainer>
      )}

      {isFormOpen && (
        <RoomForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={loadData}
          initialData={editingRoom}
          groups={groups}
          activeRooms={activeRooms}
        />
      )}
    </>
  )
}
