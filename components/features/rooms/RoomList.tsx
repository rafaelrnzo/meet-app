'use client'

import type { FC, MouseEvent } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { cn, djs, copyHandler } from '@/lib/utils'
import { generateCode } from '@/lib/api/admin-api'
import { useJoinRoom, useSourceEventRooms } from '@/hooks'
import { shareLinkHandler } from '@/feat/rooms/helper'
import { defaultErrorMessage } from '@/config'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RoomListProps {
  isLoading?: boolean
  rooms: DbRoom[]
  isAdmin: boolean
  canShareLink: boolean
  handleDetail?: (room: DbRoom) => void
  handleCloseModal?: () => void
}

interface ButtonJoinProps {
  isFull: boolean
  isAdmin: boolean
  dateStart: string
  dateEnd: string
  handleCloseModal?: () => void
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
}

const CARD_PERPAGE = 12

const CARD_COPY_SECOND = 1_000

const ButtonJoin: FC<ButtonJoinProps> = ({
  isFull,
  isAdmin,
  dateStart,
  dateEnd,
  onClick,
  handleCloseModal,
}) => {
  const [now, setNow] = useState(djs())
  const startDate = djs(dateStart)
  const endDate = djs(dateEnd)
  const status = useMemo(() => (now.isBefore(startDate) ? 'upcoming' : 'open'), [now, startDate])
  const intervalRef = useRef<ReturnType<typeof setInterval>>(void 0)

  const handleCloseModalEvent = useEffectEvent(() => {
    const now = djs()
    setNow(now)

    if (now.isAfter(endDate)) {
      clearInterval(intervalRef.current)
      handleCloseModal?.()
    }
  })

  useEffect(() => {
    intervalRef.current = setInterval(handleCloseModalEvent, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <Button
      className='w-full p-0'
      variant={!isAdmin && (status !== 'open' || isFull) ? 'secondary' : 'primary'}
      disabled={!isAdmin && (status !== 'open' || isFull)}
      onClick={onClick}
    >
      {!isAdmin && status === 'upcoming'
        ? `Mulai di ${djs(dateStart).format('DD MMMM YYYY, HH.mm')} WIB`
        : !isAdmin && isFull
          ? 'Anggota sudah mencukupi'
          : 'Masuk ke Ruangan'}
    </Button>
  )
}

const RoomList: FC<RoomListProps> = ({
  isLoading = false,
  rooms,
  canShareLink,
  isAdmin,
  handleDetail,
  handleCloseModal,
}) => {
  const [stack, setStack] = useState(1 * CARD_PERPAGE)
  const [copiedRoomName, setCopiedRoomName] = useState('')
  const { router, joinRoom } = useJoinRoom()
  const visibleRooms = rooms.slice(0, stack)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>(void 0)

  function participantLength(roomCode: string) {
    return visibleRooms.find((room) => room.room_code === roomCode)?.participants ?? 0
  }

  function isFirstParticipantJoined(roomCode: string) {
    return participantLength(roomCode) > 0
  }

  function handleLoadMore() {
    setStack((prev) => Math.min((prev / CARD_PERPAGE + 1) * CARD_PERPAGE, rooms.length))
  }

  function handleCopyLink(roomName: string) {
    setCopiedRoomName('')
    copyHandler(roomName)
      .then(() => handleShowTooltip(`copy:${roomName}`))
      .catch(() => toast.error('Gagal salin kode', { description: defaultErrorMessage }))
  }

  function handleShowTooltip(roomName: string) {
    clearTimeout(tooltipTimeoutRef.current)
    setCopiedRoomName(roomName)

    tooltipTimeoutRef.current = setTimeout(() => setCopiedRoomName(''), CARD_COPY_SECOND)
  }

  function handleGenerateRoomCode(roomId: number) {
    generateCode(roomId).then(({ code, message }) => {
      if (code) {
        return router.refresh()
      }

      toast.error(message || 'Gagal membuat kode ruangan baru')
    })
  }

  function handleShareLink(roomName: string) {
    const data = {
      title: 'Join Meeting',
      url: new URL(`/rooms/${encodeURIComponent(roomName)}`, window.location.origin).toString(),
    }

    shareLinkHandler(data)
      .then(() => handleShowTooltip(`share:${roomName}`))
      .catch(() => toast.error('Gagal bagikan kode', { description: defaultErrorMessage }))
  }

  function handleJoinRoom(roomCode: string) {
    return (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      joinRoom(roomCode)
    }
  }

  useSourceEventRooms(
    () => router.refresh(),
    ['room_updated', 'participant_joined', 'participant_left']
  )

  if (isLoading) {
    return (
      <div className='grid-cols grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }, (_, i) => i + 1).map((item) => (
          <Skeleton key={item} className='h-73.5' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='grid-cols grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {visibleRooms.map(({ room_code, ...room }) => (
          <Card
            key={room.id}
            onClick={() => handleDetail?.({ ...room, room_code })}
            className={cn(
              'relative flex min-h-73.5 flex-col space-y-4 rounded-md border-neutral-200 p-5 *:not-first:z-1',
              !!handleDetail && 'cursor-pointer hover:border-neutral-300 hover:shadow-lg'
            )}
          >
            <CardHeader className='relative grow gap-4 space-y-0 p-0'>
              {isFirstParticipantJoined(room_code) && (
                <span
                  className='absolute -top-2 -right-2 size-2 animate-pulse rounded-full bg-red-500'
                  title='Live'
                />
              )}

              <div className='flex flex-wrap items-center justify-between'>
                <CardTitle className='mb-0 min-w-1/2 flex-1 truncate text-base font-semibold text-red-800'>
                  {room.name}
                </CardTitle>
                <div className='flex items-center gap-2'>
                  {room.group?.name && (
                    <Badge
                      variant='outline'
                      className='bg-green-50 wrap-anywhere text-neutral-950 not-italic'
                    >
                      {room.group.name}
                    </Badge>
                  )}

                  {canShareLink && (
                    <Tooltip
                      open={
                        copiedRoomName.startsWith('share') && copiedRoomName.includes(room_code)
                      }
                    >
                      <TooltipTrigger asChild>
                        <Button
                          className='size-6.5 px-0'
                          variant='secondary'
                          onClick={(event) => {
                            event.stopPropagation()
                            handleShareLink(room_code)
                          }}
                        >
                          <Icon type='share' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side={'top'}>Tautan disalin</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between gap-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <Icon type='calendar' className='text-neutral-400' />
                  {`${djs(room.start_date).format('DD MMMM YYYY, HH.mm')} WIB`}
                </div>
                <div className='flex items-center gap-2'>
                  <Icon type='users' className='text-neutral-400' />
                  <span>
                    {room.participants ?? 0}/{room.max_participants ?? 0}
                  </span>
                </div>
              </div>

              <CardDescription className='line-clamp-3 wrap-anywhere'>
                {room.description || 'Tidak ada deskripsi'}
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
                <Input
                  value={room_code}
                  readOnly
                  aria-disabled
                  className='pointer-events-none opacity-100 has-[+button+button:active]:bg-neutral-200 has-[+button:active]:bg-neutral-200'
                  onChange={() => void 0}
                />
                <Tooltip
                  open={copiedRoomName.startsWith('copy') && copiedRoomName.includes(room_code)}
                >
                  <TooltipTrigger asChild>
                    <Button
                      variant='secondary'
                      onClick={() => handleCopyLink(room_code)}
                      size='icon'
                    >
                      <Icon type='copy' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Kode disalin</TooltipContent>
                </Tooltip>

                {isAdmin && (
                  <Button
                    variant='secondary'
                    onClick={() => handleGenerateRoomCode(room.id)}
                    size='icon'
                    disabled={!!participantLength(room_code)}
                  >
                    <Icon type='arrow-clockwise' />
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className='p-0'>
              <ButtonJoin
                isFull={participantLength(room_code) >= room.max_participants}
                isAdmin={isAdmin}
                dateStart={room.start_date}
                handleCloseModal={handleCloseModal}
                dateEnd={room.end_date}
                onClick={handleJoinRoom(room_code)}
              />
            </CardFooter>
          </Card>
        ))}
      </div>
      {visibleRooms.length < rooms.length && (
        <div className='flex items-center justify-center'>
          <Button variant='primary-outline' onClick={handleLoadMore}>
            Tampilkan lebih banyak
          </Button>
        </div>
      )}
    </div>
  )
}

export { RoomList }
