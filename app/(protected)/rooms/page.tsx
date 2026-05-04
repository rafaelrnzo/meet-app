'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchDbRooms,
  deleteDbRoom,
  fetchGroups,
  fetchActiveRooms,
  fetchUsers,
} from '@/lib/api/admin-api'
import type { DbRoom, Group as GroupDto, ActiveRoom, User } from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'
import { RoomList } from '@/components/features/rooms/RoomList'
import { djs } from '@/lib/utils'
import PageContainer from '@/compounds/page-container'
import { TableViewHeader } from '@/compounds/table-view/header'
import { RoomForm } from '@/components/admin/RoomForm'

export default function RoomsPage() {
  const { hasPermission } = useAuth({ requirePermission: 'room:read' })
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const { isAdmin, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)

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
    async (params?: { search?: string }) => {
      setLoading(true)
      try {
        const [r, g, ar, u] = await Promise.all([
          fetchDbRooms({ ...params }),
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

  const handleCreate = () => {
    setEditingRoom(null)
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

  return (
    <PageContainer
      icon='room'
      title='Daftar Ruangan'
      subTitle='Kelola ruangan rapat untuk setiap kebutuhan rapat'
    >
      <div className='space-y-4 md:space-y-8'>
        <TableViewHeader
          search={{
            placeholder: 'Cari nama atau kode ruangan ...',
            onSearch: ({ value }) => loadData({ search: value }),
          }}
          {...(canCreate && { add: { onClick: handleCreate } })}
        />

        <RoomList
          loading={loading}
          staticRooms={displayedRooms}
          activeRooms={activeRooms}
          isAdmin={isAdmin}
          handleDetail={canUpdate ? handleViewDetails : void 0}
        />
      </div>

      <RoomForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadData}
        initialData={editingRoom}
        groups={groups}
      />

      <RoomDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        room={selectedRoom}
        activeRoom={selectedRoom ? getActiveRoomData(selectedRoom.name) : undefined}
        canDelete={canDelete}
        onDelete={handleDelete}
        onEditSuccess={loadData}
        groups={groups}
        users={users}
      />
    </PageContainer>
  )
}
