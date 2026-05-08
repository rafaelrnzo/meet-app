import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { generateCode } from '@/lib/api/admin-api'
import type { ActiveRoom, DbRoom } from '@/lib/api/admin-api'
import { cn, djs } from '@/lib/utils'
import { Calendar, Copy, ExternalLink, Loader, RefreshCcw, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { Skeleton } from '@/components/ui/skeleton'
import { joinRoomAction } from '@/feat/rooms/helper'

interface RoomCode {
  roomId: number
  code: string
  type: 'changed' | 'not yet'
}

interface SummaryCardProps {
  loading?: boolean
  staticRooms: DbRoom[]
  activeRooms: ActiveRoom[]
  isAdmin: boolean
  handleDetail?: (room: DbRoom) => void
  handleCloseModal?: () => void
}

const CARD_PERPAGE = 6
const COOKIE_KEY = 'remaining_generate'

const ButtonJoin = ({
  isFull,
  isAdmin,
  room,
  handleCloseModal,
}: {
  isFull: boolean
  isAdmin: boolean
  room: DbRoom
  handleCloseModal?: () => void
}) => {
  const router = useRouter()
  const startDate = djs(room.start_date)
  const endDate = djs(room.end_date)
  const [now, setNow] = useState(djs())
  const [isPendingJoin, startTransitionJoin] = useTransition()
  const status = useMemo(() => (now.isBefore(startDate) ? 'upcoming' : 'open'), [now, startDate])

  useEffect(() => {
    const timer = setInterval(() => {
      const current = djs()
      setNow(current)

      const secondsLeft = endDate.diff(current, 'second')
      if (secondsLeft <= 0) {
        clearInterval(timer)
        router.refresh()
        handleCloseModal?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, handleCloseModal, router])

  return (
    <Button
      size='lg'
      className={cn('w-full p-0', !isPendingJoin && 'disabled:opacity-100')}
      variant={!isAdmin && (status !== 'open' || isFull) ? 'secondary' : 'primary'}
      disabled={(!isAdmin && (status !== 'open' || isFull)) || isPendingJoin}
      onClick={() =>
        startTransitionJoin(async () => {
          await joinRoomAction({
            code: room.room_code,
            onSuccess: (code) => router.push(`/meeting/${encodeURIComponent(code)}`),
          })
        })
      }
    >
      {isPendingJoin && <Loader className='animate-spin' />}
      {!isAdmin && status === 'upcoming'
        ? `Mulai di ${djs(room.start_date).format('DD MMMM YYYY, HH.mm')} WIB`
        : !isAdmin && isFull
          ? 'Anggota sudah mencukupi'
          : 'Masuk ke Ruangan'}
    </Button>
  )
}

function RoomList(props: SummaryCardProps) {
  const {
    loading = false,
    staticRooms,
    activeRooms,
    isAdmin,
    handleDetail,
    handleCloseModal,
  } = props
  const displayedRooms = staticRooms.map((room) => ({
    ...room,
    isLive: !!activeRooms.find((ar) => ar.name === room.room_code),
    currentParticipants:
      activeRooms.find((ar) => ar.name === room.room_code)?.num_participants || 0,
  }))
  const [roomCode, setRoomCode] = useState<RoomCode>({ roomId: 0, code: '', type: 'not yet' })
  const [visibleCards, setVisibleCards] = useState(CARD_PERPAGE)
  const [isTooltipVisible, setIsTooltipVisible] = useState<{
    action: 'copy' | 'share'
    roomId: number
  } | null>(null)
  const getGenerateExpiry = () => Number(Cookies.get(COOKIE_KEY) || 0)
  const [isDisabledGenerate, setIsDisabledGenerate] = useState(() => {
    const expiry = getGenerateExpiry()
    return !!expiry && !!djs().isBefore(expiry)
  })
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const expiry = getGenerateExpiry()

    if (!isDisabledGenerate) return

    const intervalGenerate = setInterval(() => {
      if (djs().isAfter(expiry)) {
        setIsDisabledGenerate(false)
        Cookies.remove(COOKIE_KEY)
        clearInterval(intervalGenerate)
      }
    }, 1000)

    return () => clearInterval(intervalGenerate)
  }, [isDisabledGenerate])

  const handleGenerateRoomCode = async (roomId: number) => {
    try {
      const { code } = await generateCode(roomId)
      setIsDisabledGenerate(true)
      Cookies.set(COOKIE_KEY, `${djs().add(5, 'minute').valueOf()}`)
      setRoomCode({ roomId, code, type: 'changed' })
    } catch {
      toast.error('Gagal membuat kode ruangan baru')
    }
  }

  const handleLoadMore = () => {
    setVisibleCards((prevValue) => prevValue + CARD_PERPAGE)
  }

  const handleShowTooltip = (showing: typeof isTooltipVisible) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    setIsTooltipVisible(showing)
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsTooltipVisible(null)
    }, 1000)
  }

  const handleCopyLink = async ({ roomId, roomCode }: { roomId: number; roomCode: string }) => {
    try {
      await navigator.clipboard.writeText(roomCode)
      handleShowTooltip({ action: 'copy', roomId })
    } catch {
      toast.error('Gagal salin kode')
    }
  }

  const handleShareLink = async ({ roomId, roomCode }: { roomId: number; roomCode: string }) => {
    const data = {
      title: 'Join Meeting',
      url: new URL(`/meeting/${encodeURIComponent(roomCode)}`, window.location.origin).toString(),
    }

    try {
      await navigator.clipboard.writeText(`${data.url}`)
      if (navigator.canShare?.(data)) {
        await navigator.share(data)
      }
      handleShowTooltip({ action: 'share', roomId })
    } catch {
      toast.error('Gagal bagikan kode')
    }
  }

  return (
    <div>
      {loading ? (
        <div className='grid-cols grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {Array.from({ length: 6 }, (_, i) => i + 1).map((item) => (
            <Skeleton key={item} className='h-73.5' />
          ))}
        </div>
      ) : (
        <div className='space-y-8'>
          <div className='grid-cols grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {displayedRooms.slice(0, visibleCards).map((room) => {
              const startDate = djs(room.start_date)
              const isFull = (room.currentParticipants ?? 0) >= room.max_participants
              const ownRoomCode =
                roomCode.type === 'changed'
                  ? room.id === roomCode.roomId
                    ? roomCode.code
                    : room.room_code
                  : room.room_code

              return (
                <Card
                  key={room.id}
                  className={cn(
                    'flex min-h-73.5 flex-col space-y-4 rounded-md border-neutral-200 p-5',
                    !!handleDetail && 'cursor-pointer hover:border-neutral-300 hover:shadow-lg'
                  )}
                  onClick={() => handleDetail?.(room)}
                >
                  <CardHeader className='relative grow gap-4 space-y-0 p-0'>
                    {room.isLive && (
                      <span
                        className='absolute -top-2 -right-2 size-2 animate-pulse rounded-full bg-red-500'
                        title='Live'
                      />
                    )}

                    <div className='flex flex-wrap items-center justify-between'>
                      <CardTitle className='mb-0 flex-1 truncate text-base font-semibold text-red-800 capitalize'>
                        {room.name}
                      </CardTitle>
                      <div className='flex gap-2'>
                        {room.group?.name && (
                          <Badge className='mb-0 rounded-md border-neutral-400 bg-green-50 text-neutral-950 hover:bg-green-50 hover:text-neutral-950'>
                            {room.group.name}
                          </Badge>
                        )}

                        <Tooltip
                          open={
                            isTooltipVisible?.action === 'share' &&
                            isTooltipVisible.roomId === room.id
                          }
                        >
                          <TooltipTrigger asChild>
                            <Button
                              size='icon-xs'
                              variant='secondary-outline'
                              onClick={(event) => {
                                event.stopPropagation()
                                handleShareLink({ roomId: room.id, roomCode: ownRoomCode })
                              }}
                              hidden={!isAdmin}
                            >
                              <ExternalLink className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side={isMobile ? 'top' : 'right'}>
                            Tautan disalin
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className='flex items-center justify-between gap-2 text-sm'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />{' '}
                        {`${startDate.format('DD MMMM YYYY, HH.mm')} WIB`}
                      </div>
                      <div className='flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        <span>
                          {room.currentParticipants ?? 0}/{room.max_participants ?? 0}
                        </span>
                      </div>
                    </div>

                    <CardDescription className='line-clamp-3'>
                      {room.description || 'Tidak ada deskripsi'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <div
                      className='flex items-center gap-2'
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Input
                        value={ownRoomCode}
                        className='pointer-events-none has-[+button+button:active]:bg-neutral-200 has-[+button:active]:bg-neutral-200'
                        onChange={() => void 0}
                      />
                      <Tooltip
                        open={
                          isTooltipVisible?.action === 'copy' && isTooltipVisible.roomId === room.id
                        }
                      >
                        <TooltipTrigger asChild>
                          <Button
                            variant='secondary-outline'
                            onClick={() =>
                              handleCopyLink({ roomId: room.id, roomCode: ownRoomCode })
                            }
                            size='icon'
                            className='peer'
                          >
                            <Copy size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>kode disalin</TooltipContent>
                      </Tooltip>

                      {isAdmin && (
                        <Button
                          variant='secondary-outline'
                          onClick={async () => await handleGenerateRoomCode(room.id)}
                          size='icon'
                          disabled={isDisabledGenerate}
                        >
                          <RefreshCcw size={16} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className='p-0'>
                    <ButtonJoin {...{ isFull, isAdmin, room, handleCloseModal }} />
                  </CardFooter>
                </Card>
              )
            })}
          </div>
          {visibleCards < displayedRooms.length && (
            <div className='flex items-center justify-center'>
              <Button variant='primary-outline' onClick={handleLoadMore}>
                Tampilkan lebih banyak
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { RoomList }
