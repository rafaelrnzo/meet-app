'use client'

import { Button } from '@/components/ui/button'
import type { DbRoom } from '@/lib/api/admin-api'
import { Icon } from '@/components/ui/icon'
import type { GenerateRoomCodeExp } from '@/feat/rooms/dto'
import { useEffect, useMemo } from 'react'
import { djs } from '@/lib/utils'

interface GenerateRoomCodeProps {
  room: DbRoom
  arrGenerateExp: GenerateRoomCodeExp[]
  handleGenerateRoomCode: (roomId: number) => Promise<void>
  updateExpiryData: ({ type, roomId }: { type: 'set' | 'remove'; roomId: number }) => void
}

function GenerateRoomCode(props: GenerateRoomCodeProps) {
  const { room, arrGenerateExp, handleGenerateRoomCode, updateExpiryData } = props
  const expiry = useMemo(
    () => arrGenerateExp.find((item) => item.roomId === room.id)?.exp ?? 0,
    [arrGenerateExp, room.id]
  )
  const isDisabled = useMemo(() => !!expiry && djs().isBefore(expiry), [expiry])

  useEffect(() => {
    if (!expiry) return

    const intervalGenerate = setInterval(() => {
      if (djs().isAfter(expiry)) {
        updateExpiryData({ type: 'remove', roomId: room.id })
        clearInterval(intervalGenerate)
      }
    }, 1000)

    return () => clearInterval(intervalGenerate)
  }, [expiry, room.id, updateExpiryData])

  return (
    <Button
      variant='primary-outline'
      onClick={async () => await handleGenerateRoomCode(room.id)}
      size='icon'
      disabled={isDisabled}
      className='not-hover:border-neutral-400 not-hover:bg-neutral-50 not-hover:text-neutral-400 hover:bg-red-50 disabled:border-neutral-400 disabled:bg-neutral-400 disabled:text-neutral-50 disabled:opacity-100'
    >
      <Icon type='arrow-clockwise' />
    </Button>
  )
}

export { GenerateRoomCode }
