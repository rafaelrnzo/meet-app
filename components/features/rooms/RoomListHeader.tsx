'use client'

import type { ComponentProps, FC } from 'react'
import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { omit, qstring } from '@/lib/utils'
import { TableViewHeader } from '@/compounds/table-view/header'
import { toast } from '@/components/ui/sonner'

export const RoomListHeader: FC<
  ComponentProps<typeof TableViewHeader> & { isInvalid: boolean }
> = ({ isInvalid, ...props }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = Object.fromEntries(useSearchParams())
  const isTouchedRef = useRef(false)

  useEffect(() => {
    if (isInvalid && isTouchedRef.current) {
      toast.error('Ruang rapat tidak ada', {
        description: `Ruang rapat "${searchParams.search}" tidak ditemukan.`,
      })
    }
  }, [isInvalid, searchParams.search])

  return (
    <TableViewHeader
      search={{
        placeholder: 'Cari ruangan',
        defaultValue: searchParams.search,
        autoComplete: 'off',
        'aria-invalid': isInvalid,
        onChange: (e) => {
          if (!e.target.value) {
            router.push(qstring(pathname, omit(searchParams, ['search'])))
          }
        },
        onSearch: (search) => {
          isTouchedRef.current = true
          router.push(qstring(pathname, { ...searchParams, search }))
        },
      }}
      {...props}
    />
  )
}
