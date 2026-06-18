'use client'

import type { FC } from 'react'
import { useRouter } from 'next/navigation'

export const StartMeeting: FC = () => {
  const router = useRouter()

  return (
    <button
      type='button'
      className='mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-12 text-lg font-semibold text-white'
      // onClick={() => router.push(`/rooms/${generateRoomId()}`)}
      onClick={() => router.push(`/rooms/z3gq-gq0l`)}
    >
      Start Meeting
    </button>
  )
}
