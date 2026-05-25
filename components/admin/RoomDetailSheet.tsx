'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, Copy, Trash2, LockKeyholeOpen } from 'lucide-react'
import type { DbRoom, ActiveRoom, MemberRoom, RoomParams } from '@/lib/api/admin-api'
import { fetchMemberRoom, unbanParticipant } from '@/lib/api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RoomTabs from '@/components/features/rooms/RoomTabs'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/sonner'
import { Modal, ModalDelete } from '@/components/ui/modal'
import { displayedError } from '@/lib/utils'
// Using native HTML/Tailwind for maximum flexibility as requested for "Premium UI"

export interface RoomDetailSheetProps {
  room: DbRoom | null
  activeRoom?: ActiveRoom
  isOpen: boolean
  onClose: () => void
  canDelete: boolean
  onDelete: (id: number) => void
  onEditSuccess: () => void // Callback to refresh data
  handleEdit: (room: DbRoom) => void
}
type TabsValue = 'overview' | 'participants' | 'settings'
export type StatusOption = 'all' | 'waiting' | 'banned'

export function RoomDetailSheet({
  room,
  activeRoom,
  isOpen,
  onClose,
  canDelete,
  onDelete,
  onEditSuccess,
  handleEdit,
}: RoomDetailSheetProps) {
  const [isShowTooltip, setShowTooltip] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)
  const [isOpenBlock, setIsOpenBlock] = useState(false)
  const [activeTab, setActiveTab] = useState<TabsValue>('overview')
  const tabsTrigger: TabsValue[] = ['overview', 'participants', 'settings']
  const [userParticipants, setUserParticipants] = useState<MemberRoom[]>([])
  const [adminParticipants, setAdminParticipants] = useState<MemberRoom[]>([])
  const [status, setStatus] = useState<StatusOption>('all')
  const [searchMembers, setSearchMember] = useState('')
  const [userIdentity, setUserIdentity] = useState('')

  const { isAdmin } = useAuth()
  const ROLE_USER = 'user'
  const params = useRef<RoomParams>({})

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(room?.room_code ?? '')
      setShowTooltip(true)
      setTimeout(() => {
        setShowTooltip(false)
      }, 1000)
    } catch {
      toast.error('Gagal salin kode')
    }
  }

  const loadUsers = useCallback(
    async (searchParams?: RoomParams & { status?: StatusOption }) => {
      try {
        const member = await fetchMemberRoom({
          roomId: room?.id || 0,
          searchParams: {
            ...searchParams,
            ...(status !== 'all' && { status }),
          },
        })
        setUserParticipants(
          member.filter(
            ({ role, room_presence }) =>
              role.name === ROLE_USER && (room_presence === 'banned' || room_presence === 'waiting')
          )
        )
      } catch (error) {
        displayedError(error, 'Gagal loading data')
      }
    },
    [status, room?.id]
  )

  const loadAdmin = async () => {
    try {
      const member = await fetchMemberRoom({
        roomId: room?.id || 0,
      })
      setAdminParticipants(member.filter(({ role }) => role.name !== ROLE_USER))
    } catch (error) {
      displayedError(error, 'Gagal loading data')
    }
  }

  const handleUnbanParticipant = async (roomCode: string, identity: string) => {
    try {
      await unbanParticipant(roomCode, identity)
      toast.success(`Berhasil buka blokir peserta`, {
        description: `Blokir peserta ${identity} berhasil dibuka`,
      })
    } catch (error) {
      displayedError(error, 'Gagal buka blokir peserta')
    }
  }

  useEffect(() => {
    if (room?.id) {
      loadUsers()
    }
    if (isOpen === false) {
      setSearchMember('')
      setStatus('all')
      setActiveTab('overview')
    }
  }, [isOpen, loadUsers, room?.id])

  useEffect(() => {
    if (room?.id) {
      loadAdmin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id])

  return (
    <AnimatePresence>
      {isOpen && room && (
        <>
          <motion.div
            {...({
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0 },
              onClick: onClose,
              className: 'fixed inset-0 z-50 bg-black/40',
            } as any)}
          />
          <motion.div
            {...({
              initial: { x: '100%' },
              animate: { x: 0 },
              exit: { x: '100%' },
              transition: { type: 'spring', damping: 25, stiffness: 200 },
              className:
                'fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col p-[30px] min-w-[600px]',
            } as any)}
          >
            <div className='mb-2 border-b border-red-800 pb-5'>
              <div className='mb-3 flex w-full items-center justify-between'>
                <div>
                  <h2 className='text-lg font-semibold text-red-800'>{room.name}</h2>
                </div>
                <div className='flex items-center gap-2'>
                  {isAdmin && (
                    <Button
                      variant='outline'
                      onClick={() => {
                        onClose()
                        handleEdit(room)
                      }}
                      size='icon-lg'
                      className='rounded-md'
                    >
                      <Edit2 className='size-4 fill-neutral-950' />
                    </Button>
                  )}
                  <Button
                    size='icon-lg'
                    variant='destructive'
                    onClick={onClose}
                    className='rounded-md'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Input
                  value={room.room_code || room.id}
                  className='pointer-events-none has-[+button+button:active]:bg-neutral-200 has-[+button:active]:bg-neutral-200'
                  onChange={() => void 0}
                />
                <Tooltip open={isShowTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant='secondary-outline'
                      onClick={handleCopyLink}
                      size='icon'
                      className='peer'
                    >
                      <Copy size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>kode disalin</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className='flex h-full flex-col overflow-y-auto'>
              <Tabs defaultValue={activeTab} className='h-full overflow-auto'>
                <TabsList variant='line'>
                  {tabsTrigger.map((tabs) => (
                    <TabsTrigger
                      key={tabs}
                      value={tabs}
                      onClick={() => setActiveTab(tabs)}
                      className='cursor-pointer text-sm font-medium text-neutral-400 hover:text-red-800 data-[state=active]:text-red-800'
                    >
                      {tabs === 'overview'
                        ? 'Ringkasan Ruangan'
                        : tabs === 'participants'
                          ? 'Akses dan Anggota Ruangan'
                          : 'Pengaturan Ruangan'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={activeTab}>
                  <RoomTabs
                    setIsOpenDelete={setIsOpenDelete}
                    allParticipants={{
                      admin: adminParticipants || [],
                      users: userParticipants || [],
                    }}
                    setUserIdentity={setUserIdentity}
                    setIsOpenBlock={setIsOpenBlock}
                    canDelete={canDelete}
                    onDelete={onDelete}
                    getPresentationUrl={getPresentationUrl}
                    onEditSuccess={onEditSuccess}
                    room={room}
                    activeRoom={activeRoom}
                    value={activeTab}
                    onClose={onClose}
                    searchParticipants={{
                      value: searchMembers,
                      onChange: (e) => setSearchMember(e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                          loadUsers({ ...params.current, search: searchMembers })
                        }
                      },
                    }}
                    filterParticipants={{
                      value: status,
                      onValueChange: (val) => setStatus(val),
                    }}
                  />
                </TabsContent>
              </Tabs>
              <div className='animate-in fade-in slide-in-from-bottom-4 mt-2 space-y-6 duration-300'>
                <Button
                  onClick={onClose}
                  className='mt-0 w-full cursor-pointer rounded-md bg-red-800 py-2.5 text-sm font-semibold text-white'
                >
                  Tutup Detail
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <ModalDelete
        key='modal-delete'
        root={{
          open: isOpenDelete,
          onOpenChange: setIsOpenDelete,
        }}
        title={{
          children: 'Hapus ruangan ?',
        }}
        submit={{
          children: (
            <>
              <Trash2 />
              Hapus Ruangan
            </>
          ),
          onClick: () => {
            setIsOpenDelete(false)
            onDelete(room?.id ?? 0)
          },
        }}
        cancel={{
          children: 'Batal',
        }}
      >
        Tindakan ini akan menghapus ruangan ini dan semua data terkait secara permanen. Tindakan ini
        tidak dapat dibatalkan.
      </ModalDelete>
      <Modal
        key='modal-block'
        root={{ open: isOpenBlock, onOpenChange: setIsOpenBlock }}
        title={{
          className: 'text-error',
          children: 'Buka blokir peserta ?',
        }}
        content={{
          className: 'max-w-[320px]',
        }}
        footer={{
          className: 'flex-col! flex-col-reverse! items-center w-full!',
        }}
        submit={{
          className: 'w-full!',
          children: (
            <>
              <LockKeyholeOpen className='text-error size-4' />
              Buka blokir
            </>
          ),
          onClick: () => {
            setIsOpenBlock(false)
            handleUnbanParticipant(room?.room_code ?? '', userIdentity)
          },
        }}
        cancel={{
          children: 'Batal',
          className: 'w-full!',
        }}
      >
        Tindakan ini akan membuka blokir peserta. Apakah Anda ingin lanjut?
      </Modal>
    </AnimatePresence>
  )
}
