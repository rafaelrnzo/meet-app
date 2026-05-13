'use client'

import type { RoomDetailSheetProps, StatusOption } from '@/components/admin/RoomDetailSheet'
import { Button } from '@/components/ui/button'
import DropFile from '@/components/ui/dropfile'
import type { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import type { MemberRoom } from '@/lib/api/admin-api'
import {
  deleteRoomPresentation,
  getOnePresentation,
  updateRoomPermissions,
  uploadRoomPresentation,
} from '@/lib/api/admin-api'
import { cn, djs } from '@/lib/utils'
import {
  Ban,
  Calendar1,
  DoorOpen,
  Filter,
  Hourglass,
  LockKeyholeOpen,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface RoomTabsProps extends Omit<RoomDetailSheetProps, 'isOpen' | 'groups' | 'handleEdit'> {
  value: 'overview' | 'participants' | 'settings'
  getPresentationUrl: (val: string | undefined) => string
  searchParticipants: React.ComponentProps<typeof Input>
  allParticipants: {
    admin: MemberRoom[]
    users: MemberRoom[]
  }
  filterParticipants: {
    value: string
    onValueChange: (val: StatusOption) => void
  }
  setIsOpenDelete: (val: boolean) => void
  setIsOpenBlock: (val: boolean) => void
  setUserIdentity: (val: string) => void
}

type FileResponse = {
  file_name: string
  file_url: string
  size: number
}

export default function RoomTabs({
  value,
  activeRoom,
  room,
  onEditSuccess,
  onClose,
  allParticipants,
  searchParticipants,
  filterParticipants,
  setIsOpenDelete,
  setIsOpenBlock,
  setUserIdentity,
}: RoomTabsProps) {
  const { isAdmin } = useAuth()
  const [files, setFiles] = useState<FileResponse[]>([])
  const MAX_FILE = 5

  const loadPresentations = async () => {
    try {
      const file = await getOnePresentation(room?.id || 0)
      setFiles(Array.isArray(file) ? file : file ? [file] : [])
    } catch (error) {
      console.error('Failed to load data', error)
    }
  }

  const handleUploadFile = async (files: File[]) => {
    try {
      toast.loading('Uploading presentation...')
      const { path } = await uploadRoomPresentation(room?.id ?? 0, files[0])
      // If room is active, update metadata to sync immediately
      if (activeRoom) {
        try {
          const currentMeta = activeRoom.metadata ? JSON.parse(activeRoom.metadata) : {}
          const newMeta = {
            ...currentMeta,
            presentation: {
              isOpen: true,
              url: path,
            },
          }
          await updateRoomPermissions(room?.name ?? '', newMeta)
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
  }

  const handleRemoveFile = async () => {
    try {
      await deleteRoomPresentation(room?.id ?? 0)
      toast.success('Berhasil menghapus file')
    } catch (error) {
      toast.error('Gagal menghapus file')
      console.error(error)
    }
  }

  useEffect(() => {
    if (room?.id) {
      loadPresentations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id])

  const type = () => {
    switch (value) {
      case 'overview':
        return (
          <div className='animate-in fade-in slide-in-from-bottom-4 mt-4 duration-300'>
            <div
              className={cn(
                activeRoom
                  ? 'border-red-800 bg-transparent px-5 text-red-800'
                  : 'text-error border-red-200 bg-red-200 px-5',
                'my-2 w-full rounded-md border py-3'
              )}
            >
              {activeRoom ? (
                <div className='flex items-center gap-2 font-medium'>
                  <div className='rounded-md border border-red-800 bg-red-50 p-2.5'>
                    <DoorOpen className='fill-red-800' />
                  </div>
                  <span>Rapat sedang berlangsung</span>
                </div>
              ) : (
                <div className='flex items-center gap-2 font-medium'>
                  <div className='border-error rounded-md border bg-red-200 p-2.5'>
                    <DoorOpen className='fill-error' />
                  </div>
                  <span>Belum ada rapat</span>
                </div>
              )}
            </div>
            <div className='my-2 grid grid-cols-1 md:grid-cols-2 md:gap-2'>
              <div className='rounded-md border border-red-800 px-5 py-3'>
                <Calendar1 className='size-4 text-red-800' />
                <p className='font-medium text-red-800'>Dibuat pada</p>
                <p className='text-xs'>{djs(room?.start_date).format('DD/MM/YYYY, HH:mm:ss')}</p>
              </div>
              <div className='block rounded-md border border-red-800 px-5 py-3'>
                <Users className='size-4 text-red-800' />
                <p className='font-medium text-red-800'>Maksimal peserta</p>
                <p className='text-xs'>{activeRoom?.num_participants ?? 0} peserta</p>
              </div>
            </div>
            {isAdmin && (
              <div>
                <div className='my-2'>
                  <p className='pb-2'>Deskripsi ruangan</p>
                  <div className='min-h-16 rounded-md border border-slate-400 px-3 py-1 shadow-sm'>
                    {room?.description || '-'}
                  </div>
                </div>
                <div className='my-2'>
                  <p className='pb-2'>Unggah berkas presentasi</p>
                  <DropFile
                    files={
                      files.map((item) => ({
                        name: item.file_name,
                        url: item.file_url,
                        size: item.size,
                      })) || []
                    }
                    maxFilesSizeInMB={MAX_FILE}
                    onUploadFile={(files) => {
                      handleUploadFile(files)
                    }}
                    onRemoveFile={handleRemoveFile}
                  />
                </div>
              </div>
            )}
          </div>
        )
      case 'participants':
        return (
          <div>
            <div className='animate-in fade-in slide-in-from-bottom-4 mt-4 duration-300'>
              <p className='mb-2'>Peserta yang memiliki otoritas</p>
              <div className='mb-2'>
                {!allParticipants.admin || allParticipants.admin.length === 0 ? (
                  <div className='flex h-[159px] items-center justify-center rounded-md bg-red-200'>
                    <div className='text-center'>
                      <div className='flex justify-center'>
                        <div className='border-error flex size-12 items-center justify-center rounded-md border'>
                          <X className='text-error size-6' />
                        </div>
                      </div>
                      <p className='text-error text-[18px] font-medium'>
                        Tidak ada pengguna yang memiliki otoritas
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {allParticipants.admin.map((user, idx) => {
                      return (
                        <div
                          key={idx}
                          className='my-1 flex h-14 items-center gap-2 rounded-md border border-red-800 px-5 py-3 transition-colors'
                        >
                          <div className='flex size-8 items-center justify-center rounded-full border border-red-800 bg-rose-50 text-sm font-semibold text-red-800'>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className='text-sm font-medium text-red-800'>{user.username}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className='mb-2'>
              <div className='my-4'>
                <p className='mb-2'>Peserta ruangan</p>
                <div className='flex items-center justify-between gap-2'>
                  <InputGroup className='has-[[data-slot][aria-invalid=true]]:[&>input]:text-error flex max-h-9 w-full items-center gap-2 rounded-md border border-neutral-400 px-3 py-[7.5px] shadow-sm has-[[data-slot][aria-invalid=true]]:border-red-200 has-[[data-slot][aria-invalid=true]]:bg-red-200'>
                    <InputGroupInput
                      aria-invalid={!!searchParticipants.value && !allParticipants.users.length}
                      placeholder='Cari peserta ...'
                      className='border-none p-0 shadow-none focus-visible:ring-0'
                      {...searchParticipants}
                    />
                    <InputGroupAddon>
                      <Search className='size-4 text-neutral-400' />
                    </InputGroupAddon>
                  </InputGroup>
                  <Select
                    value={filterParticipants.value}
                    onValueChange={filterParticipants.onValueChange}
                  >
                    <SelectTrigger className='w-fit cursor-pointer border border-neutral-400 [&>svg]:last:hidden'>
                      <Filter className='size-3' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='max-w-[187px] wrap-anywhere'>
                      <SelectGroup>
                        <SelectItem value='all'>Semua</SelectItem>
                        <SelectItem value='waiting'>Menunggu persetujuan</SelectItem>
                        <SelectItem value='banned'>Diblokir</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {allParticipants.users.length <= 0 ? (
                <div className='text-center'>
                  <div className='flex justify-center'>
                    <div className='border-error flex size-12 items-center justify-center rounded-md border'>
                      <X className='size-6 text-red-800' />
                    </div>
                  </div>
                  <p className='text-error text-[18px] font-medium'>
                    Tidak Ada Peserta yang Menunggu <br /> Persetujuan maupun yang Diblokir
                  </p>
                </div>
              ) : (
                allParticipants.users.map((user, idx) => {
                  const isWaiting = user.room_presence === 'waiting'
                  return (
                    <div
                      key={idx}
                      className={cn(
                        isWaiting ? 'border-neutral-950' : 'border-error',
                        'my-1 flex h-14 items-center justify-between gap-2 rounded-md border px-5 py-3 transition-colors'
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        {isWaiting ? (
                          <Hourglass className='size-[19.5px] text-neutral-950' />
                        ) : (
                          <Ban className='text-error size-[19.5px]' />
                        )}
                        <span
                          className={cn(
                            isWaiting ? 'text-neutral-950' : 'text-error',
                            'text-sm font-medium'
                          )}
                        >
                          {user.username}
                        </span>
                      </div>
                      {isWaiting ? (
                        <span className='font-semibold text-neutral-400 opacity-50'>
                          Menunggu persetujuan
                        </span>
                      ) : (
                        isAdmin && (
                          <Button
                            variant='destructive'
                            className='text-error flex items-center gap-2'
                            onClick={() => {
                              onClose()
                              setIsOpenBlock(true)
                              setUserIdentity(user.username)
                            }}
                          >
                            <LockKeyholeOpen className='text-error size-4' />
                            Buka Blokir
                          </Button>
                        )
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300'>
            <div className='border-destructive/20 bg-destructive/5 space-y-4 rounded-xl border p-4'>
              <div className='text-error text-xl font-semibold'>Hapus Ruangan</div>
              <p className='text-sm text-slate-600'>
                Menghapus ruangan ini akan menghilangkannya secara permanen dan memutuskan sambungan
                semua peserta yang sedang aktif.
              </p>
              <Button
                variant='destructive'
                className='flex w-full items-center justify-center gap-2'
                onClick={() => {
                  onClose()
                  setIsOpenDelete(true)
                }}
              >
                <Trash2 />
                Hapus Ruangan
              </Button>
            </div>
          </div>
        )
    }
  }
  return type()
}
