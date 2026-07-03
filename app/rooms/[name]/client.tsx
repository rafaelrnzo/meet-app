'use client'

import { default as dynamic } from 'next/dynamic'

export const RoomsDetail = dynamic(async () => (await import('@/feat/Room')).RoomDetail, {
  ssr: false,
  loading: () => (
    <div className='bg-background text-foreground fixed inset-0 flex items-center justify-center'>
      <div className='border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent' />
    </div>
  ),
})
