'use client'

import type { DbRoom } from '@/lib/api/admin-api'
import type { GenerateRoomCodeExp } from '@/feat/rooms/dto'
import { useEffect, useMemo } from 'react'
import { djs } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

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
      variant='secondary'
      onClick={async () => await handleGenerateRoomCode(room.id)}
      size='icon'
      disabled={isDisabled}
    >
      <Icon type='arrow-clockwise' />
    </Button>
  )
}

export { GenerateRoomCode }
