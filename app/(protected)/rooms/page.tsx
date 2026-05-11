'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchDbRooms,
  deleteDbRoom,
  fetchGroups,
  fetchActiveRooms,
  fetchUsers,
} from '@/lib/api/admin-api'
import type { DbRoom, Group as GroupDto, ActiveRoom, User, RoomParams } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'
import { RoomList } from '@/components/features/rooms/RoomList'
import { djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { RoomForm } from '@/components/admin/RoomForm'
import { applyRoomEventToActiveRooms, useRealTimeRooms } from '@/hooks/use-real-time-rooms'
import type { SortRoomType } from '@/feat/rooms/dto'
import { SORT_ROOM } from '@/feat/rooms/dto'

export default function RoomsPage() {
  const { hasPermission } = useAuth({ requirePermission: 'room:read' })
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const { isAdmin, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const params = useRef<RoomParams>({ sort: 'newest' })

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
        const [r, g, ar, u] = await Promise.all([
          fetchDbRooms({ ...params, sort: params?.sort ?? 'newest' }), // set default newest
          isAdmin ? fetchGroups() : Promise.resolve([]),
          fetchActiveRooms().catch(() => []),
          isAdmin ? fetchUsers() : Promise.resolve([]),
        ])
        setRooms(r || [])
        setGroups(g || [])
        setActiveRooms(ar || [])
        setUsers(u || [])
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
    if (confirm('Delete this room?')) {
      await deleteDbRoom(id)
      if (selectedRoom?.id === id) setIsDetailOpen(false)
      loadData()
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

  const isTypeSort = (sort: string): sort is SortRoomType => {
    return !!sort && SORT_ROOM.some((item) => item === sort)
  }

  return (
    <PageContainer
      icon='room'
      title='Daftar Ruangan'
      subTitle='Kelola ruangan rapat untuk setiap kebutuhan rapat'
    >
      <div className='space-y-4 md:space-y-8'>
        <TableViewHeader
          search={{
            placeholder: 'Cari ruangan',
            onSearch: ({ value }) => {
              const updateParams = { ...params.current, search: value }
              params.current = updateParams
              loadData(updateParams)
            },
            'aria-invalid': !!params.current.search && !displayedRooms.length,
          }}
          {...(canCreate && { add: { onClick: handleCreate } })}
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
              {
                value: 'group',
                label: 'Kelompok',
              },
            ],
            selectProps: {
              select: {
                value: params.current.sort,
                onValueChange: (value) => {
                  if (isTypeSort(value)) {
                    const updateParams = { ...params.current, sort: value }
                    params.current = updateParams
                    loadData(updateParams)
                  }
                },
              },
            },
          }}
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
        groups={groups}
        users={users}
        handleEdit={(room: DbRoom) => handleEdit(room)}
      />
    </PageContainer>
  )
}
