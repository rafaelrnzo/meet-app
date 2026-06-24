'use client'

import type { FC } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { omit, qstring } from '@/lib/utils'
import { TableViewHeader } from '@/compounds/table-view/header'

export const RoomListHeader: FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = Object.fromEntries(useSearchParams())

  return (
    <TableViewHeader
      search={{
        placeholder: 'Cari ruangan',
        onSearch: (search) => {
          router.push(
            qstring(
              pathname,
              !search ? omit(searchParams, ['search']) : { ...searchParams, search }
            )
          )
        },
      }}
    />
  )
}
