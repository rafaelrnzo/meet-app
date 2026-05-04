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
import { Calendar, Copy, ExternalLink, RefreshCcw, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

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
}

const CARD_PERPAGE = 6
const COOKIE_KEY = 'remaining_generate'

function RoomList(props: SummaryCardProps) {
  const { loading = false, staticRooms, activeRooms, isAdmin, handleDetail } = props

  const now = djs()
  const router = useRouter()
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

  const ButtonJoin = ({
    status,
    isFull,
    room,
  }: {
    status: string
    isFull: boolean
    room: DbRoom
  }) => {
    return (
      <Button
        size='lg'
        className='w-full p-0 disabled:opacity-100'
        variant={!isAdmin && (status !== 'open' || isFull) ? 'secondary' : 'primary'}
        disabled={!isAdmin && (status !== 'open' || isFull)}
        onClick={() => router.push(`/meeting/${encodeURIComponent(room.room_code)}`)}
      >
        {!isAdmin && status === 'upcoming'
          ? `Mulai di ${djs(room.start_date).format('DD MMMM YYYY, HH.mm')} WIB`
          : !isAdmin && isFull
            ? 'Anggota sudah mencukupi'
            : 'Masuk ke Ruangan'}
      </Button>
    )
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
      if (navigator.canShare?.(data)) {
        await navigator.share(data)
      }
      await navigator.clipboard.writeText(`${data.url}`)
      handleShowTooltip({ action: 'share', roomId })
    } catch {
      toast.error('Gagal bagikan kode')
    }
  }

  return (
    <div>
      {loading ? (
        <div className='text-muted-foreground py-12 text-center text-sm'>Loading rooms...</div>
      ) : (
        <div className='space-y-8'>
          <div className='grid-cols grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {displayedRooms.slice(0, visibleCards).map((room) => {
              const startDate = djs(room.start_date)
              const status = now.isBefore(startDate) ? 'upcoming' : 'open'
              const isFull =
                room.assigned_to?.length > 0 &&
                (room.currentParticipants ?? 0) >= room.max_participants
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
                    'space-y-4 rounded-md border-neutral-200 p-5',
                    !!handleDetail && 'cursor-pointer hover:border-neutral-300 hover:shadow-lg'
                  )}
                  onClick={() => handleDetail?.(room)}
                >
                  <CardHeader className='relative gap-4 space-y-0 p-0'>
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

                    <CardDescription>{room.description || 'Tidak ada deskripsi'}</CardDescription>
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
                    <ButtonJoin {...{ status, isFull, room }} />
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
