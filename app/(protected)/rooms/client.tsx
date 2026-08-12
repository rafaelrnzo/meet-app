'use client'

import type { FC } from 'react'
import type { DbRoom, Group } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { cn, displayedError, omit, qstring } from '@/lib/utils'
import { deleteDbRoom, fetchUserDbRooms } from '@/lib/api/admin-api'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSourceEventRooms } from '@/hooks'
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

const ROOM_COUNT_EVENTS = ['room_updated']

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
  const [roomState, setRoomState] = useState(rooms)
  const [openState, setOpenState] = useState<'form' | 'panel' | ''>('')
  const [selectedRoom, setSelectedRoom] = useState<DbRoom | null>(null)
  const openForm = openState === 'form'
  const openPanel = openState === 'panel'

  useEffect(() => {
    setRoomState(rooms)
  }, [rooms])

  async function refreshRooms() {
    const nextRooms = await fetchUserDbRooms(searchParams)
    setRoomState(nextRooms)
  }

  useSourceEventRooms((event) => {
    if (event.type !== 'room_updated') return

    void refreshRooms()
    setRoomState((prev) =>
      prev.map((room) => {
        const sameRoom =
          room.id === event.data?.id ||
          room.room_code === event.data?.room_code ||
          room.room_code === event.data?.room_id

        return sameRoom ? { ...room, participants: event.data?.participants ?? 0 } : room
      })
    )
  }, ROOM_COUNT_EVENTS, '/admin/rooms/events')

  function handleDelete(deletedId: number) {
    deleteDbRoom(deletedId)
      .then(() => {
        toast.success('Ruang rapat berhasil dihapus', {
          description: `Ruang rapat "${selectedRoom?.name}" berhasil dihapus`,
        })
      })
      .catch((e) => displayedError(e, 'Gagal menghapus ruang rapat'))
  }

  function handleDetail(room: DbRoom) {
    setSelectedRoom(room)
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
              setSelectedRoom(null)
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
                initialData={selectedRoom}
                groups={groups}
                activeParticipant={
                  roomState.find((room) => room.room_code === selectedRoom?.room_code)?.participants
                }
              >
                <Button
                  variant='primary'
                  className='w-full'
                  onClick={() => setSelectedRoom(null)}
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
        rooms={roomState}
        isAdmin={isAdmin}
        canShareLink={canShareLink}
        handleDetail={handleDetail}
        handleCloseModal={() => {
          setOpenState('')
          router.refresh()
        }}
      />

      <RoomDetailSheet
        isOpen={isMobile ? false : openPanel}
        onClose={() => setOpenState('')}
        room={
          roomState.find((room) => room.room_code === selectedRoom?.room_code) ?? selectedRoom
        }
        canDelete={isAdmin}
        onDelete={handleDelete}
        handleEdit={(room) => setOpenState(room ? 'form' : '')}
        isModalDetail={isMobile ? openPanel : false}
        setModalDetail={isMobile ? (io) => setOpenState(io ? 'panel' : '') : void 0}
      />
    </>
  )
}
