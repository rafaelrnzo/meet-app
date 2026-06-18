'use client'

import { default as dynamic } from 'next/dynamic'
import { Loading } from '@/components/Loading'

export const RoomsDetail = dynamic(async () => (await import('@/feat/Room')).RoomDetail, {
  ssr: false,
  loading: () => <Loading className='fixed' />,
})
