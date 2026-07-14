'use client'

import type { FC } from 'react'
import type { DbRoom, Group } from '@/lib/api/admin-api'
import { useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { cn, displayedError, omit, qstring } from '@/lib/utils'
import { deleteDbRoom } from '@/lib/api/admin-api'
import { useIsMobile } from '@/hooks/use-mobile'
import { default as NoData } from '@/components/ui/no-data'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { RoomListHeader } from '@/components/features/rooms/RoomListHeader'
import { RoomList } from '@/components/features/rooms/RoomList'
import { RoomForm } from '@/components/admin/RoomForm'
import { RoomDetailSheet } from '@/components/admin/RoomDetailSheet'

export interface RoomListClientProps {
  rooms: DbRoom[]
  groups: Group[]
  isAdmin: boolean
  isEmpty: boolean
  isInvalid: boolean
  canCreate: boolean
  canShareLink: boolean
}

export const RoomListClient: FC<RoomListClientProps> = ({
  rooms,
  groups,
  isAdmin,
  isEmpty,
  isInvalid,
  canCreate,
  canShareLink,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = Object.fromEntries(useSearchParams())
  const isMobile = useIsMobile()

  // State
  const [openState, setOpenState] = useState<'form' | 'panel' | ''>('')
  const selectedRoomRef = useRef<DbRoom | null>(null)
  const openForm = openState === 'form'
  const openPanel = openState === 'panel'

  function handleDelete(deletedId: number) {
    deleteDbRoom(deletedId)
      .then(() => {
        toast.success('Ruang rapat berhasil dihapus', {
          description: `Ruang rapat "${selectedRoomRef.current?.name}" berhasil dihapus`,
        })
      })
      .catch((e) => displayedError(e, 'Gagal menghapus ruang rapat'))
  }

  function handleDetail(room: DbRoom) {
    selectedRoomRef.current = room
    setOpenState('panel')
  }

  return (
    <>
      {isEmpty && (
        <NoData
          title='Tidak Ada Ruangan yang Tersedia'
          desc='Silakan buat ruangan baru.'
          className='mt-[min(20vh,200px)]'
          insertButton={{
            children: (
              <>
                <Icon type='plus' /> Buat Ruangan Baru
              </>
            ),
            onClick: () => {
              selectedRoomRef.current = null
              setOpenState('form')
            },
          }}
        />
      )}

      <div className={cn(isEmpty ? 'hidden' : '') || void 0} inert={isEmpty}>
        <RoomListHeader
          isInvalid={isInvalid}
          {...(canCreate && {
            addCustom: (
              <RoomForm
                open={openForm}
                onOpenChange={(val) => setOpenState(!val ? '' : 'form')}
                initialData={selectedRoomRef.current}
                groups={groups}
                activeParticipant={
                  rooms.find((room) => room.room_code === selectedRoomRef.current?.room_code)
                    ?.participants
                }
              >
                <Button
                  variant='primary'
                  className='w-full'
                  onClick={() => (selectedRoomRef.current = null)}
                >
                  <Icon type='plus' /> Tambah Ruangan
                </Button>
              </RoomForm>
            ),
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
                value: searchParams.sort || 'newest',
                onValueChange: (value) => {
                  router.push(
                    qstring(
                      pathname,
                      value === 'newest'
                        ? omit(searchParams, ['sort'])
                        : { ...searchParams, sort: value }
                    )
                  )
                },
              },
            },
          }}
          headerAddon={isInvalid ? `${rooms.length} Daftar Ruangan` : null}
        />
      </div>

      <RoomList
        rooms={rooms}
        isAdmin={isAdmin}
        canShareLink={canShareLink}
        handleDetail={handleDetail}
        handleCloseModal={() => setOpenState('')}
      />

      <RoomDetailSheet
        isOpen={isMobile ? false : openPanel}
        onClose={() => setOpenState('')}
        room={selectedRoomRef.current}
        canDelete={isAdmin}
        onDelete={handleDelete}
        handleEdit={(room) => setOpenState(room ? 'form' : '')}
        isModalDetail={isMobile ? openPanel : false}
        setModalDetail={isMobile ? (io) => setOpenState(io ? 'panel' : '') : void 0}
      />
    </>
  )
}
