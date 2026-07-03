'use client'

import type { DbRoom, ActiveRoom } from '@/lib/api/admin-api'
import { Users, Calendar, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RoomCardProps {
  room: DbRoom
  activeRoom?: ActiveRoom
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

export function RoomCard({ room, activeRoom, onClick, onDelete }: RoomCardProps) {
  const isActive = !!activeRoom

  return (
    <motion.div
      {...{ layoutId: `room-${room.id}` }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group bg-card text-card-foreground relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md',
        isActive ? 'border-primary/50 shadow-primary/10' : 'border-border'
      )}
      onClick={onClick}
    >
      <div className='absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100'>
        <button
          onClick={onDelete}
          className='hover:bg-destructive/10 text-destructive rounded-full p-2 transition-colors'
          title='Delete Room'
        >
          <MoreVertical className='h-4 w-4' />
        </button>
      </div>

      <div className='flex flex-col gap-4'>
        {/* Header */}
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg leading-tight font-bold tracking-tight'>{room.name}</h3>
            {isActive && (
              <span className='relative flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75'></span>
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500'></span>
              </span>
            )}
          </div>
          <p className='text-muted-foreground mt-1 line-clamp-1 text-xs'>
            {room.description || 'No description provided'}
          </p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div className='text-muted-foreground bg-muted/50 flex items-center gap-2 rounded-lg p-2'>
            <Users className='h-4 w-4' />
            <span className='text-foreground font-medium'>
              {isActive ? activeRoom.num_participants : 0}
            </span>
            <span className='text-xs'>/ {room.max_participants}</span>
          </div>
          <div className='text-muted-foreground bg-muted/50 flex items-center gap-2 rounded-lg p-2'>
            <Calendar className='h-4 w-4' />
            <span className='text-xs'>
              {new Date(room.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Footer / Status */}
        <div className='mt-auto flex items-center justify-between pt-2'>
          <div
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase',
              isActive
                ? 'border-green-500/20 bg-green-500/10 text-green-600'
                : 'bg-muted text-muted-foreground border-transparent'
            )}
          >
            {isActive ? 'Live Now' : 'Idle'}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-primary flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100'
          >
            View Details →
          </motion.div>
        </div>
      </div>

      {/* Decorative gradient blob */}
      <div
        className={cn(
          'bg-primary/5 absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl transition-all duration-500',
          isActive && 'bg-green-500/10'
        )}
      />
    </motion.div>
  )
}
