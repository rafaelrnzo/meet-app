'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Trash2,
  Eye,
  Search,
  Calendar,
  Users,
  Hash,
  Globe,
  Lock,
  LayoutGrid,
  MonitorPlay,
  ArrowUpDown,
  Clock,
  Copy,
} from 'lucide-react'
import {
  fetchDbRooms,
  deleteDbRoom,
  fetchGroups,
  fetchActiveRooms,
  fetchUsers,
  type DbRoom,
  type Group as GroupDto,
  type ActiveRoom,
  type User,
} from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import { RoomFormModal } from '@/components/admin/RoomFormModal'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'
import { cn } from '@/lib/utils'

export default function RoomsPage() {
  const { hasPermission } = useAuth({ requirePermission: 'room:read' })
  const [rooms, setRooms] = useState<DbRoom[]>([])
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'live' | 'public' | 'private' | 'group'>(
    'all'
  )
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest')

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<DbRoom | null>(null)

  // Detail Sheet State
  const [selectedRoom, setSelectedRoom] = useState<DbRoom | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const canCreate = hasPermission('room:create')
  const canUpdate = hasPermission('room:update')
  const canDelete = hasPermission('room:delete')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [r, g, ar, u] = await Promise.all([
        fetchDbRooms(),
        fetchGroups(),
        fetchActiveRooms().catch(() => []),
        fetchUsers().catch(() => []),
      ])
      setRooms(r || [])
      setGroups(g || [])
      setActiveRooms(ar || [])
      setUsers(u || [])
    } catch (error) {
      console.error('Failed to load data', error)
    }
  }

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

  // Filter rooms based on search and filters
  const filteredRooms = rooms
    .filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_code.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      switch (filterType) {
        case 'live':
          return !!getActiveRoomData(room.name)
        case 'public':
          return !room.group && (!room.assigned_to || room.assigned_to.length === 0)
        case 'private':
          return !room.group && room.assigned_to && room.assigned_to.length > 0
        case 'group':
          return !!room.group
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alpha':
          return a.name.localeCompare(b.name)
        case 'oldest':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case 'newest':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      }
    })

  const getRoomGradient = (id: number) => {
    const gradients = [
      'from-blue-500/20 to-indigo-500/20 text-blue-600',
      'from-emerald-500/20 to-teal-500/20 text-emerald-600',
      'from-orange-500/20 to-red-500/20 text-orange-600',
      'from-violet-500/20 to-purple-500/20 text-violet-600',
      'from-pink-500/20 to-rose-500/20 text-pink-600',
    ]
    return gradients[id % gradients.length]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className='mx-auto max-w-[1600px] space-y-6'>
      {/* Header Section */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Rooms</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage your virtual meeting spaces and schedules.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreate}
            className='shadow-primary/20 shadow-lg transition-all hover:scale-105'
          >
            <Plus className='mr-2 h-4 w-4' /> Create Room
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className='bg-card/50 border-border/50 flex w-full flex-col items-stretch gap-3 rounded-xl border p-1.5 backdrop-blur-sm sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search rooms...'
            className='placeholder:text-muted-foreground/50 h-10 border-0 bg-transparent pl-9 focus-visible:ring-0 focus-visible:ring-offset-0'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='flex items-center gap-2'>
          {/* Status Filter */}
          <div className='relative'>
            <select
              className='border-border/50 bg-background/50 focus:ring-primary/20 hover:bg-muted/50 h-9 cursor-pointer appearance-none rounded-lg border pr-8 pl-3 text-sm transition-colors focus:ring-2 focus:outline-none'
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value='all'>All Rooms</option>
              <option value='live'>Live Now</option>
              <option value='public'>Public</option>
              <option value='private'>Private</option>
              <option value='group'>Group</option>
            </select>
            <LayoutGrid className='text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          </div>

          {/* Sort Order */}
          <div className='relative'>
            <select
              className='border-border/50 bg-background/50 focus:ring-primary/20 hover:bg-muted/50 h-9 cursor-pointer appearance-none rounded-lg border pr-8 pl-3 text-sm transition-colors focus:ring-2 focus:outline-none'
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value='newest'>Newest First</option>
              <option value='oldest'>Oldest First</option>
              <option value='alpha'>Name (A-Z)</option>
            </select>
            <ArrowUpDown className='text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filteredRooms.length === 0 ? (
          <div className='text-muted-foreground border-border bg-card/50 col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed p-16'>
            <div className='bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
              <Search className='h-8 w-8 opacity-40' />
            </div>
            <p className='text-xl font-medium'>No rooms found</p>
            <p className='mt-1 text-sm opacity-70'>Try adjusting your filters or search</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const now = new Date()
            const start = new Date(room.start_date)
            const end = new Date(room.end_date)
            const status = now < start ? 'upcoming' : now > end ? 'ended' : 'open'
            const isActive = !!getActiveRoomData(room.name)

            return (
              <div
                key={room.id}
                onClick={() => handleViewDetails(room)}
                className='group bg-card border-border hover:border-primary/50 relative cursor-pointer rounded-lg border p-4 transition-all'
              >
                {isActive && (
                  <span
                    className='absolute top-4 right-4 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500'
                    title='Live Now'
                  />
                )}

                <div className='mb-3'>
                  <h4 className='truncate pr-6 text-sm font-semibold'>{room.name}</h4>
                  <p className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                    {room.description || 'No description'}
                  </p>
                </div>

                <div
                  className='bg-muted border-border mb-3 flex items-center justify-between rounded border px-3 py-2'
                  onClick={(e) => e.stopPropagation()}
                >
                  <code className='text-primary font-mono text-xs font-medium'>
                    {room.room_code}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(room.room_code)}
                    className='text-muted-foreground hover:text-foreground p-1 transition-colors'
                    title='Copy Code'
                  >
                    <Copy className='h-3 w-3' />
                  </button>
                </div>

                <div className='text-muted-foreground mb-4 flex flex-col gap-2 text-xs'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                      <Calendar className='h-3 w-3' />
                      {start.toLocaleDateString()}
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='h-3 w-3' />
                      <span>
                        {formatTime(room.start_date)} - {formatTime(room.end_date)}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    {room.group ? (
                      <span className='flex items-center gap-1 text-indigo-500'>
                        <Users className='h-3 w-3' /> {room.group.name}
                      </span>
                    ) : room.assigned_to?.length ? (
                      <span className='flex items-center gap-1 text-amber-500'>
                        <Lock className='h-3 w-3' /> Private
                      </span>
                    ) : (
                      <span className='flex items-center gap-1 text-emerald-500'>
                        <Globe className='h-3 w-3' /> Public
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant='outline'
                  className={cn(
                    'border-border/50 h-8 w-full text-xs font-medium',
                    status === 'open'
                      ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                      : status === 'ended'
                        ? 'text-muted-foreground bg-muted/50'
                        : 'border-blue-500/20 bg-blue-500/5 text-blue-600'
                  )}
                  disabled={true}
                >
                  {status === 'ended'
                    ? 'Ended'
                    : status === 'upcoming'
                      ? 'Scheduled'
                      : 'Open / Active'}
                </Button>
              </div>
            )
          })
        )}
      </div>

      <RoomFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        editingRoom={editingRoom}
        groups={groups}
        users={users}
      />

      <RoomDetailSheet
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        room={selectedRoom}
        activeRoom={selectedRoom ? getActiveRoomData(selectedRoom.name) : undefined}
        onDelete={handleDelete}
        onEditSuccess={loadData}
        groups={groups}
        users={users}
      />
    </div>
  )
}
