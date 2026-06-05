'use client'

import { Button } from '@/components/ui/button'
import DropFile from '@/components/ui/dropfile'
import { Icon } from '@/components/ui/icon'
import type { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import type { FileResponse, StatusOption } from '@/feat/rooms/dto'
import { useAuth } from '@/hooks/use-auth'
import type { ActiveRoom, DbRoom, MemberRoom } from '@/lib/api/admin-api'
import { cn, djs } from '@/lib/utils'
import NoData from '@/components/ui/no-data'

export interface RoomContentsProps {
  overview: {
    room: DbRoom | null
    activeRoom?: ActiveRoom
    setFiles?: (e: FileResponse[]) => void
    files: FileResponse[]
    maxFile: number
    handleUploadFile: (e: File[]) => void
    handleRemoveFile: () => void
  }
  participants: {
    allParticipants: {
      admin: MemberRoom[]
      users: MemberRoom[]
    }
    searchParticipants: React.ComponentProps<typeof Input>
    filterParticipants: {
      value: string
      onValueChange: (val: StatusOption) => void
    }
    onClose: () => void
    setIsOpenBlock: (val: boolean) => void
    setUserIdentity: (val: string) => void
  }
  settings: Pick<RoomContentsProps['participants'], 'onClose'> &
    Pick<RoomContentsProps['overview'], 'activeRoom'> & {
      setIsOpenDelete: (val: boolean) => void
    }
}

function OverviewContent({
  activeRoom,
  room,
  files,
  maxFile: MAX_FILE,
  handleUploadFile,
  handleRemoveFile,
}: RoomContentsProps['overview']) {
  const { isAdmin } = useAuth()
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
              <Icon type='door' className='text-red-800' />
            </div>
            <span>Rapat sedang berlangsung</span>
          </div>
        ) : (
          <div className='flex items-center gap-2 font-medium'>
            <div className='border-error rounded-md border bg-red-200 p-2.5'>
              <Icon type='slash-door' className='text-error' />
            </div>
            <span>Belum ada rapat</span>
          </div>
        )}
      </div>
      <div className='my-2 grid grid-cols-1 gap-2 md:grid-cols-2'>
        <div className='rounded-md border border-red-800 px-5 py-3'>
          <Icon type='calendar' className='text-red-800' />
          <p className='font-medium text-red-800'>Dibuat pada</p>
          <p className='text-xs'>{djs(room?.createdAt).format('DD/MM/YYYY, HH:mm:ss')}</p>
        </div>
        <div className='block rounded-md border border-red-800 px-5 py-3'>
          <Icon type='users' className='text-red-800' />
          <p className='font-medium text-red-800'>Maksimal peserta</p>
          <p className='text-xs'>{room?.max_participants ?? 0} peserta</p>
        </div>
      </div>
      {isAdmin && (
        <div>
          <div className='my-2'>
            <p className='pb-2'>Deskripsi ruangan</p>
            <div className='min-h-16 rounded-md border border-slate-400 px-3 py-1 wrap-break-word whitespace-pre-wrap shadow-sm'>
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
}

function ParticipantsContent({
  allParticipants,
  searchParticipants,
  filterParticipants,
  onClose,
  setIsOpenBlock,
  setUserIdentity,
}: RoomContentsProps['participants']) {
  const { isAdmin } = useAuth()
  return (
    <div>
      <div className='animate-in fade-in slide-in-from-bottom-4 mt-4 duration-300'>
        <p className='mb-2'>Peserta yang memiliki otoritas</p>
        <div className='mb-2'>
          {!allParticipants.admin || allParticipants.admin.length === 0 ? (
            <NoData
              title='Tidak ada pengguna yang memiliki otoritas'
              className='min-h-[159px] rounded-md bg-red-200'
            />
          ) : (
            <div>
              {allParticipants.admin.map((user, idx) => {
                return (
                  <div
                    key={idx}
                    className='my-1 flex h-14 items-center justify-between gap-2 rounded-md border border-red-800 px-5 py-3 transition-colors'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='flex size-8 items-center justify-center rounded-full border border-red-800 bg-rose-50 text-sm font-semibold text-red-800'>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className='text-sm font-medium text-red-800'>{user.username}</span>
                    </div>
                    <div className='rounded-md border border-red-800 bg-red-50 px-2 py-1 text-red-800'>
                      {user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)}
                    </div>
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
                className='h-auto'
                {...searchParticipants}
              />
              <InputGroupAddon>
                <Icon type='search' className='size-4 text-neutral-400' />
              </InputGroupAddon>
            </InputGroup>
            <Select
              value={filterParticipants.value}
              onValueChange={filterParticipants.onValueChange}
            >
              <SelectTrigger className='w-fit cursor-pointer border border-neutral-400 [&>svg]:last:hidden'>
                <Icon type='filter' className='text-neutral-950!' />
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
          <NoData
            title='Tidak Ada Peserta yang Menunggu Persetujuan maupun yang Diblokir'
            className='max-h-[calc(100vh-550px)] min-h-[calc(100vh-650px)]'
          />
        ) : (
          <div className='overflow-auto'>
            {allParticipants.users.map((user, idx) => {
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
                      <Icon type='hourglass' className='size-[19.5px] text-neutral-950' />
                    ) : (
                      <Icon type='block' className='text-error size-[19.5px]' />
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
                        <Icon type='lock-open' className='text-error size-4' />
                        Buka Blokir
                      </Button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsContent({ onClose, setIsOpenDelete, activeRoom }: RoomContentsProps['settings']) {
  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300'>
      <div className='border-destructive/20 bg-destructive/5 space-y-4 rounded-xl border p-4'>
        <div className='text-error text-xl font-semibold'>Hapus Ruangan</div>
        <p className='text-sm text-slate-600'>
          Menghapus ruangan ini akan menghilangkannya secara permanen dan memutuskan sambungan semua
          peserta yang sedang aktif.
        </p>
        <Button
          variant='destructive'
          className='flex w-full items-center justify-center gap-2'
          onClick={() => {
            onClose()
            setIsOpenDelete(true)
          }}
          disabled={!!activeRoom}
        >
          <Icon type='trash' />
          {activeRoom ? 'Rapat Sedang Berlangsung' : 'Hapus Ruangan'}
        </Button>
      </div>
    </div>
  )
}

export { OverviewContent, ParticipantsContent, SettingsContent }
