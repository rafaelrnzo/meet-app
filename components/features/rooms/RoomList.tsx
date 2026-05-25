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
import { Calendar, Copy, ExternalLink, Loader, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from '@/components/ui/sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { Skeleton } from '@/components/ui/skeleton'
import { copyToClipboardHandler, joinRoomAction, shareLinkHandler } from '@/feat/rooms/helper'
import { GenerateRoomCode } from './GenerateRoomCode'
import type { GenerateRoomCodeExp, NewRoomCode } from '@/feat/rooms/dto'

interface SummaryCardProps {
  loading?: boolean
  staticRooms: DbRoom[]
  activeRooms: ActiveRoom[]
  isAdmin: boolean
  handleDetail?: (room: DbRoom) => void
  handleCloseModal?: () => void
}

const CARD_PERPAGE = 6
const COOKIE_GENERATE_EXP = 'remaining_generate'

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
      className={cn('w-full p-0', !isPendingJoin && 'disabled:opacity-100')}
      variant={!isAdmin && (status !== 'open' || isFull) ? 'secondary' : 'primary'}
      disabled={(!isAdmin && (status !== 'open' || isFull)) || isPendingJoin}
      onClick={(event) => {
        event.stopPropagation()
        startTransitionJoin(async () => {
          await joinRoomAction({
            code: room.room_code,
            onSuccess: (code) => router.push(`/meeting/${encodeURIComponent(code)}`),
          })
        })
      }}
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
  const [newRoomCode, setNewRoomCode] = useState<NewRoomCode[]>([])
  const [visibleCards, setVisibleCards] = useState(CARD_PERPAGE)
  const [isTooltipVisible, setIsTooltipVisible] = useState<{
    action: 'copy' | 'share'
    roomId: number
  } | null>(null)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()

  const getGenerateCodeExp = () => {
    const cookieData = Cookies.get(COOKIE_GENERATE_EXP)
    if (!cookieData) return []

    const parsedCookieData: GenerateRoomCodeExp[] = JSON.parse(cookieData)
    return parsedCookieData
  }

  const [arrGenerateExp, setArrGenerateExp] = useState<GenerateRoomCodeExp[]>(getGenerateCodeExp())

  const updateExpiryData = ({ type, roomId }: { type: 'set' | 'remove'; roomId: number }) => {
    let payload: GenerateRoomCodeExp[] = []

    if (type === 'set') {
      const roomIndex = arrGenerateExp.findIndex((item) => item.roomId === roomId)
      const exp = djs().add(5, 'minute').valueOf()
      payload =
        roomIndex < 0
          ? [...arrGenerateExp, { roomId, exp }] // if not found, add to array
          : arrGenerateExp.map((item, index) => (index === roomIndex ? { ...item, exp } : item))
    } else {
      payload = arrGenerateExp.filter((item) => item.roomId !== roomId)
    }

    Cookies.set(COOKIE_GENERATE_EXP, JSON.stringify(payload))
    setArrGenerateExp(payload)
  }

  const handleGenerateRoomCode = async (roomId: number) => {
    try {
      const { code } = await generateCode(roomId)
      updateExpiryData({ type: 'set', roomId })
      setNewRoomCode((prev) => {
        const isExist = prev.find((item) => item.roomId === roomId)
        if (!isExist) return [...prev, { roomId, code }]
        return prev.map((item) => (item.roomId === roomId ? { ...item, code } : item))
      })
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
    const response = await copyToClipboardHandler(roomCode)
    if (!response?.error) {
      handleShowTooltip({ action: 'copy', roomId })
    }
  }

  const handleShareLink = async ({ roomId, roomCode }: { roomId: number; roomCode: string }) => {
    const data = {
      title: 'Join Meeting',
      url: new URL(`/meeting/${encodeURIComponent(roomCode)}`, window.location.origin).toString(),
    }
    const response = await shareLinkHandler(data)
    if (!response?.error) {
      handleShowTooltip({ action: 'share', roomId })
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
                newRoomCode.find((item) => item.roomId === room.id)?.code ?? room.room_code

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

                        <Tooltip
                          open={
                            isTooltipVisible?.action === 'share' &&
                            isTooltipVisible.roomId === room.id
                          }
                        >
                          <TooltipTrigger asChild>
                            <Button
                              className='size-6.5 px-0'
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

                    <CardDescription className='line-clamp-3 wrap-anywhere'>
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
                        <TooltipContent>Kode disalin</TooltipContent>
                      </Tooltip>

                      {isAdmin && (
                        <GenerateRoomCode
                          {...{ room, arrGenerateExp, handleGenerateRoomCode, updateExpiryData }}
                        />
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
