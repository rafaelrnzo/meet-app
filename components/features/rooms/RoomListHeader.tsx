'use client'

import type { ComponentProps, FC } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { omit, qstring } from '@/lib/utils'
import { TableViewHeader } from '@/compounds/table-view/header'

export const RoomListHeader: FC<ComponentProps<typeof TableViewHeader>> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = Object.fromEntries(useSearchParams())

  return (
    <TableViewHeader
      search={{
        placeholder: 'Cari ruangan',
        autoComplete: 'off',
        onSearch: (search) => {
          router.push(
            qstring(
              pathname,
              !search ? omit(searchParams, ['search']) : { ...searchParams, search }
            )
          )
        },
      }}
      {...props}
    />
  )
}
