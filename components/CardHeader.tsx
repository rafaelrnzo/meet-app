'use client'

import type { FC } from 'react'
import type { DbRoom } from '@/lib/api/admin-api'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { qstring } from '@/lib/utils'
import { TableViewHeader } from '@/compounds/table-view/header'

export const RoomListHeader: FC<{ rooms?: DbRoom[] }> = ({ rooms = [] }) => {
  const [queryRoom, setQueryRoom] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = Object.fromEntries(useSearchParams())
  const encodedQuery = encodeURIComponent(queryRoom.trim().toLowerCase())
  const room = rooms.find((room) => `${room.id}`.toLowerCase().startsWith(encodedQuery))
  const disabled = !room || !queryRoom.trim().length

  const timeout = useRef<ReturnType<typeof setTimeout>>(void 0)
  const pushRouter = useEffectEvent((query: string) => {
    router.push(qstring(pathname, { ...searchParams, search: query }, { skipEmpty: true }))
  })

  useEffect(() => {
    timeout.current = setTimeout(() => pushRouter(encodedQuery), 250)

    return () => {
      clearTimeout(timeout.current)
    }
  }, [encodedQuery])

  return (
    <TableViewHeader
      search={{
        placeholder: 'Cari ruangan',
        // 'aria-invalid': disabled,
        onSearch: (search) => {
          clearTimeout(timeout.current)
          setQueryRoom(search)
        },
      }}
      // {...((!isMobile || isSearchNotFound) && {
      //   headerAddon: (
      //     <span className='text-base font-semibold text-red-800'>
      //       {displayedRooms.length} Daftar Ruangan
      //     </span>
      //   ),
      // })}
    />
  )
}
