'use client'

import type { GenerateRoomCodeExp } from '@/feat/rooms/dto'
import { useState } from 'react'
import { default as Cookies } from 'js-cookie'
import { createResponseError, createResponseSuccess, djs } from '@/lib/utils'
import { generateCode } from '@/lib/api/admin-api'
import { toast } from '@/components/ui/sonner'

const COOKIE_GENERATE_EXP = 'remaining_generate'
const DURATION_IN_MINUTES = 5

export function useGenerateCode() {
  const [items, setItems] = useState<GenerateRoomCodeExp[]>(() => {
    const cookie = Cookies.get(COOKIE_GENERATE_EXP)
    return cookie ? (JSON.parse(cookie) as GenerateRoomCodeExp[]) : []
  })

  const updateItems = (updater: (prev: GenerateRoomCodeExp[]) => GenerateRoomCodeExp[]) => {
    setItems((prev) => {
      const next = updater(prev)
      Cookies.set(COOKIE_GENERATE_EXP, JSON.stringify(next))
      return next
    })
  }

  const setExpiry = (roomId: number) => {
    updateItems((prev) => {
      const exp = djs().add(DURATION_IN_MINUTES, 'minute').valueOf()

      const index = prev.findIndex((item) => item.roomId === roomId)

      return index === -1
        ? [...prev, { roomId, exp }]
        : prev.map((item) => (item.roomId === roomId ? { ...item, exp } : item))
    })
  }

  const removeExpiry = (roomId: number) => {
    updateItems((prev) => prev.filter((item) => item.roomId !== roomId))
  }

  const generateRoomHandler = async (roomId: number) => {
    try {
      const { code } = await generateCode(roomId)
      setExpiry(roomId)
      return createResponseSuccess(code)
    } catch (error) {
      toast.error('Gagal membuat kode ruangan baru')
      return createResponseError<string>(error, '')
    }
  }

  const getExpiry = (roomId: number) => {
    return items.find((item) => item.roomId === roomId)?.exp ?? 0
  }

  const isDisabled = (roomId: number) => {
    const exp = getExpiry(roomId)
    return !!exp && djs().isBefore(exp)
  }

  return {
    items,
    isDisabled,
    generateRoomHandler,
    getExpiry,
    removeExpiry,
  }
}
