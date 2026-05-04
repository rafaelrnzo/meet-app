'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  Shield,
  Clock,
  Trash2,
  Edit2,
  Copy,
  BarChart3,
  Settings,
  ChevronLeft,
  Ban,
  Unlock,
  FileText,
  Upload,
} from 'lucide-react'
import type { DbRoom, ActiveRoom, Group, User } from '@/lib/api/admin-api'
import {
  unbanParticipant,
  uploadRoomPresentation,
  updateRoomPermissions,
} from '@/lib/api/admin-api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
// Using native HTML/Tailwind for maximum flexibility as requested for "Premium UI"
import { RoomForm } from './RoomForm'

interface RoomDetailSheetProps {
  room: DbRoom | null
  activeRoom?: ActiveRoom
  isOpen: boolean
  onClose: () => void
  canDelete: boolean
  onDelete: (id: number) => void
  onEditSuccess: () => void // Callback to refresh data
  groups: Group[]
  users: User[]
}

export function RoomDetailSheet({
  room,
  activeRoom,
  isOpen,
  onClose,
  canDelete,
  onDelete,
  onEditSuccess,
  groups,
  users,
}: RoomDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'settings'>('overview')
  const [isEditing, setIsEditing] = useState(false)

  // Helper to construct full URL for presentations
  const getPresentationUrl = (path: string | undefined): string => {
    if (!path) return ''

    // If already a full URL (http/https), return as-is (backward compatibility)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    // If relative path, prepend backend URL
    const API_BASE =
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:8080`
        : 'http://localhost:8080')

    return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`
  }

  // Reset tab and editing state when room changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
      setIsEditing(false)
    }
  }, [isOpen, room])

  return (
    <AnimatePresence>
      {isOpen && room && (
        <>
          {/* Backdrop */}
          <motion.div
            {...({
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: onClose,
              className: 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
            } as any)}
          />

          {/* Sheet */}
          <motion.div
            {...({
              initial: { x: '100%' },
              animate: { x: 0 },
              exit: { x: '100%' },
              transition: { type: 'spring', damping: 25, stiffness: 200 },
              className:
                'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col',
            } as any)}
          >
            {/* Header */}
            <div className='border-border bg-card/50 flex items-center justify-between border-b p-6'>
              <div className='flex items-center gap-3'>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className='hover:bg-muted text-muted-foreground hover:text-foreground -ml-2 rounded-full p-1 transition-colors'
                  >
                    <ChevronLeft className='h-5 w-5' />
                  </button>
                )}
                <div>
                  <motion.h2
                    {...({ layoutId: `room-title-${room.id}` } as any)}
                    className='text-xl font-bold'
                  >
                    {isEditing ? 'Edit Room' : room.name}
                  </motion.h2>
                  {!isEditing && (
                    <p className='text-muted-foreground mt-1 flex items-center gap-2 text-sm'>
                      ID: {room.room_code || room.id}
                      <button
                        className='hover:text-foreground transition-colors'
                        onClick={() => navigator.clipboard.writeText(room.name)}
                      >
                        <Copy className='h-3 w-3' />
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className='hover:bg-muted text-muted-foreground hover:text-primary rounded-full p-2 transition-colors'
                    title='Edit Room'
                  >
                    <Edit2 className='h-4 w-4' />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className='hover:bg-muted text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {isEditing ? (
              <div className='animate-in slide-in-from-right-4 flex-1 overflow-y-auto p-6 duration-300'>
                <RoomForm
                  initialData={room}
                  groups={groups}
                  users={users}
                  onSuccess={() => {
                    setIsEditing(false)
                    onEditSuccess()
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className='border-border flex items-center gap-6 border-b px-6 text-sm font-medium'>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                      'relative py-4 transition-colors',
                      activeTab === 'overview'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Overview
                    {activeTab === 'overview' && (
                      <motion.div
                        className='bg-primary absolute right-0 bottom-0 left-0 h-0.5'
                        {...({ layoutId: 'activeTab' } as any)}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={cn(
                      'relative py-4 transition-colors',
                      activeTab === 'participants'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    People & Access
                    {activeTab === 'participants' && (
                      <motion.div
                        className='bg-primary absolute right-0 bottom-0 left-0 h-0.5'
                        {...({ layoutId: 'activeTab' } as any)}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                      'relative py-4 transition-colors',
                      activeTab === 'settings'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Settings
                    {activeTab === 'settings' && (
                      <motion.div
                        className='bg-primary absolute right-0 bottom-0 left-0 h-0.5'
                        {...({ layoutId: 'activeTab' } as any)}
                      />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className='flex-1 space-y-6 overflow-y-auto p-6'>
                  {activeTab === 'overview' && (
                    <>
                      <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300'>
                        {/* Status Card */}
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-xl border p-4',
                            activeRoom
                              ? 'border-green-500/20 bg-green-500/5'
                              : 'bg-muted/30 border-border'
                          )}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-full',
                                activeRoom
                                  ? 'bg-green-500/10 text-green-600'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <BarChart3 className='h-5 w-5' />
                            </div>
                            <div>
                              <h3 className='text-sm font-semibold'>
                                {activeRoom ? 'Session Active' : 'Room Idle'}
                              </h3>
                              <p className='text-muted-foreground text-xs'>
                                {activeRoom
                                  ? `Started ${new Date(activeRoom.creation_time * 1000).toLocaleTimeString()}`
                                  : 'No active meeting session'}
                              </p>
                            </div>
                          </div>
                          {activeRoom && (
                            <div className='text-right'>
                              <span className='text-2xl font-bold text-green-600'>
                                {activeRoom.num_participants}
                              </span>
                              <p className='text-muted-foreground text-[10px] font-semibold uppercase'>
                                Online
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='bg-card border-border space-y-1 rounded-xl border p-4'>
                            <div className='text-muted-foreground mb-2 flex items-center gap-2'>
                              <Clock className='h-4 w-4' />
                              <span className='text-xs font-semibold uppercase'>Created</span>
                            </div>
                            <p className='text-sm font-medium'>
                              {room.created_at ? new Date(room.created_at).toLocaleString() : '-'}
                            </p>
                          </div>
                          <div className='bg-card border-border space-y-1 rounded-xl border p-4'>
                            <div className='text-muted-foreground mb-2 flex items-center gap-2'>
                              <Users className='h-4 w-4' />
                              <span className='text-xs font-semibold uppercase'>Max Capacity</span>
                            </div>
                            <p className='text-sm font-medium'>
                              {room.max_participants} Participants
                            </p>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <h3 className='text-foreground text-sm font-semibold'>Description</h3>
                          <div className='bg-muted/30 border-border text-muted-foreground rounded-xl border p-4 text-sm'>
                            {room.description || 'No description set for this room.'}
                          </div>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <h3 className='text-foreground text-sm font-semibold'>Presentation</h3>
                        <div className='bg-card border-border space-y-3 rounded-xl border p-4'>
                          {room.presentation_path ? (
                            <div className='bg-muted/50 border-border/50 flex items-center justify-between rounded-lg border p-3'>
                              <div className='flex items-center gap-3 overflow-hidden'>
                                <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-red-500/10 text-red-600'>
                                  <FileText className='h-4 w-4' />
                                </div>
                                <div className='min-w-0'>
                                  <p className='max-w-[200px] truncate text-sm font-medium'>
                                    {room.presentation_path.split('/').pop()}
                                  </p>
                                  <a
                                    href={getPresentationUrl(room.presentation_path)}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-primary text-xs hover:underline'
                                  >
                                    View PDF
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className='border-border bg-muted/30 rounded-lg border border-dashed p-4 text-center'>
                              <p className='text-muted-foreground text-sm'>
                                No presentation uploaded
                              </p>
                            </div>
                          )}

                          <div className='pt-2'>
                            <label className='flex flex-col gap-2'>
                              <span className='text-muted-foreground text-xs font-semibold uppercase'>
                                Update Presentation (PDF)
                              </span>
                              <input
                                type='file'
                                accept='application/pdf'
                                className='file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-xs file:font-semibold'
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return

                                  if (file.type !== 'application/pdf') {
                                    toast.error('Please upload a valid PDF file')
                                    return
                                  }

                                  try {
                                    toast.loading('Uploading presentation...')
                                    const { path } = await uploadRoomPresentation(room.id, file)

                                    // If room is active, update metadata to sync immediately
                                    if (activeRoom) {
                                      try {
                                        const currentMeta = activeRoom.metadata
                                          ? JSON.parse(activeRoom.metadata)
                                          : {}
                                        const newMeta = {
                                          ...currentMeta,
                                          presentation: {
                                            isOpen: true,
                                            url: path,
                                          },
                                        }
                                        await updateRoomPermissions(room.name, newMeta)
                                        toast.success('Presentation synced to active meeting')
                                      } catch (err) {
                                        console.error('Failed to sync metadata', err)
                                      }
                                    }

                                    toast.dismiss()
                                    toast.success('Presentation uploaded successfully')
                                    onEditSuccess()
                                  } catch (error) {
                                    toast.dismiss()
                                    toast.error('Failed to upload presentation')
                                    console.error(error)
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'participants' && (
                    <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300'>
                      {/* Authorized Users Section */}
                      <div>
                        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
                          <Users className='text-primary h-4 w-4' />
                          Authorized Participants
                        </h3>
                        <div className='border-border bg-card overflow-hidden rounded-xl border'>
                          {!room.assigned_to || room.assigned_to.length === 0 ? (
                            <div className='text-muted-foreground p-8 text-center text-sm'>
                              <p>No specific users assigned.</p>
                              <p className='mt-1 text-xs opacity-70'>
                                This room is likely open or public.
                              </p>
                            </div>
                          ) : (
                            <div className='divide-border divide-y'>
                              {room.assigned_to.map((userIdOrName, idx) => {
                                // Try to find user if it's an ID
                                const user = users.find(
                                  (u) =>
                                    u.id.toString() === userIdOrName || u.username === userIdOrName
                                )
                                const displayName = user ? user.username : userIdOrName

                                return (
                                  <div
                                    key={idx}
                                    className='hover:bg-muted/50 flex items-center gap-3 p-3 transition-colors'
                                  >
                                    <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold'>
                                      {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className='text-sm font-medium'>{displayName}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Admins Section */}
                      <div>
                        <h3 className='mb-3 flex items-center gap-2 text-sm font-semibold'>
                          <Shield className='h-4 w-4 text-orange-500' />
                          Room Admins
                        </h3>
                        <div className='border-border bg-card flex items-center gap-3 rounded-xl border p-3'>
                          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-600'>
                            <Shield className='h-5 w-5' />
                          </div>
                          <div>
                            <p className='text-sm font-bold'>System Administrators</p>
                            <p className='text-muted-foreground text-xs'>Full access control</p>
                          </div>
                        </div>
                      </div>

                      {/* Banned Users Section */}
                      {room.banned_users && room.banned_users.length > 0 && (
                        <div>
                          <h3 className='text-destructive mb-3 flex items-center gap-2 text-sm font-semibold'>
                            <Ban className='h-4 w-4' />
                            Banned Users
                          </h3>
                          <div className='border-destructive/20 bg-destructive/5 divide-destructive/10 divide-y overflow-hidden rounded-xl border'>
                            {room.banned_users.map((user, idx) => (
                              <div
                                key={idx}
                                className='hover:bg-destructive/10 flex items-center justify-between p-3 transition-colors'
                              >
                                <div className='flex items-center gap-3'>
                                  <div className='bg-destructive/10 text-destructive flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold'>
                                    <Ban className='h-4 w-4' />
                                  </div>
                                  <span className='text-destructive text-sm font-medium'>
                                    {user}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await unbanParticipant(room.room_code, user)
                                      toast.success(`Unbanned ${user}`)
                                      onEditSuccess()
                                    } catch (e) {
                                      toast.error('Failed to unban user')
                                    }
                                  }}
                                  className='bg-background border-border hover:bg-muted flex items-center gap-1 rounded border p-1.5 text-xs font-medium transition-colors'
                                >
                                  <Unlock className='h-3 w-3' />
                                  Unban
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300'>
                      <div className='border-destructive/20 bg-destructive/5 space-y-4 rounded-xl border p-4'>
                        <div className='text-destructive flex items-center gap-2 font-semibold'>
                          <Trash2 className='h-4 w-4' />
                          Danger Zone
                        </div>
                        <p className='text-muted-foreground text-xs'>
                          Deleting this room will permanently remove it and disconnect any active
                          participants.
                        </p>
                        <button
                          disabled={!canDelete} // TODO: disabled ketika sedang mulai
                          onClick={() => onDelete(room.id)}
                          className='text-destructive border-destructive/20 hover:bg-destructive w-full rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-sm transition-all hover:text-white'
                        >
                          Delete Room
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className='border-border bg-muted/10 border-t p-6'>
                  <button
                    onClick={onClose}
                    className='bg-primary text-primary-foreground w-full rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-90'
                  >
                    Close Details
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
