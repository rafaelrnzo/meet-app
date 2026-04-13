'use client'

import React from 'react'
import { X } from 'lucide-react'
import type { DbRoom, Group, User } from '@/lib/api/admin-api'
import { RoomForm } from './RoomForm'

interface RoomFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingRoom?: DbRoom | null
  groups: Group[]
  users: User[]
}

export function RoomFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingRoom,
  groups,
  users,
}: RoomFormModalProps) {
  if (!isOpen) return null

  return (
    <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200'>
      <div className='bg-card border-border animate-in zoom-in-95 w-full max-w-xl rounded-lg border shadow-2xl duration-200'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <h3 className='text-sm font-semibold'>{editingRoom ? 'Update Room' : 'Create Room'}</h3>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='p-5'>
          <RoomForm
            initialData={editingRoom}
            groups={groups}
            users={users}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
