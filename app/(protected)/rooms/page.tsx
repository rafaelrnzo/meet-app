'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchDbRooms, deleteDbRoom, fetchGroups, fetchActiveRooms } from '@/lib/api/admin-api'
import type { DbRoom, Group as GroupDto, ActiveRoom, RoomParams } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'
import { RoomList } from '@/components/features/rooms/RoomList'
import { cn, djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { RoomForm } from '@/components/admin/RoomForm'
import { applyRoomEventToActiveRooms, useRealTimeRooms } from '@/hooks/use-real-time-rooms'
import type { SortRoomType } from '@/feat/rooms/dto'
import { SORT_ROOM } from '@/feat/rooms/dto'
import { Plus } from 'lucide-react'
import { handleSearchNotFound } from '@/feat/rooms/helper'
import { toast } from '@/components/ui/sonner'

export const displayedError = (error: unknown, titleError: string) => {
  const message = error instanceof Error ? error.message : String(error)
  const displayedMessage = message
    ? message
    : 'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman'
  toast.error(titleError, {
    description: displayedMessage,
  })
}

export default function RoomsPage() {
  const { hasPermission } = useAuth({ requirePermission: 'room:read' })
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const { isAdmin, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [queryParams, setQueryParams] = useState<RoomParams>({ sort: 'newest' })

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<DbRoom | null>(null)

  // Detail Sheet State
  const [selectedRoom, setSelectedRoom] = useState<DbRoom | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const canCreate = hasPermission('room:create')
  const canUpdate = hasPermission('room:update')
  const canDelete = hasPermission('room:delete')

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
        setTimeout(() => setLoading(false), 500)
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

  const handleEdit = (room: DbRoom) => {
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
    setSelectedRoom(room)
    setIsDetailOpen(true)
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
                  <Plus /> Tambah Ruangan
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
              className={cn('text-base font-semibold text-red-800', !isSearchNotFound && 'hidden')}
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
          handleDetail={canUpdate ? handleViewDetails : void 0}
          handleCloseModal={() => {
            setIsDetailOpen(false)
            if (isFormOpen && editingRoom) setIsFormOpen(false)
          }}
        />
      </div>

      <RoomForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
        initialData={editingRoom}
        groups={groups}
        activeRooms={activeRooms}
      />

      <RoomDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        room={selectedRoom}
        activeRoom={selectedRoom ? getActiveRoomData(selectedRoom.room_code) : undefined}
        canDelete={canDelete}
        onDelete={handleDelete}
        onEditSuccess={loadData}
        handleEdit={(room: DbRoom) => handleEdit(room)}
      />
    </PageContainer>
  )
}
