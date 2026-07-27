'use client'

import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { Role } from '@/lib/api/admin-api'
import { default as ActionButton } from '@/compounds/action-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icon } from '@/components/ui/icon'

interface RolesColumnProps {
  openManage: (e: Role) => void
}

interface ActionButtonProps extends RolesColumnProps {
  row: CellContext<Role, unknown>['row']
}

const ActionColumn = (props: ActionButtonProps) => {
  const { openManage, row } = props
  const roleName = row.original.name.toLowerCase()
  const isEditable = roleName === 'moderator' || roleName === 'user'
  return (
    <ActionButton
      buttonComp={[
        {
          text: 'Kelola Kelompok',
          variant: 'secondary-light',
          icon: <Icon type='settings' />,
          onClick: () => openManage(row.original),
          hide: !isEditable,
        },
      ]}
    />
  )
}

export const rolesColumn = ({ openManage }: RolesColumnProps): ColumnDef<Role>[] => [
  {
    accessorKey: 'name',
    header: 'Nama Peran',
    minSize: 250,
    maxSize: 250,
    cell: ({ row }) => {
      const name = row.original.name
      const rename =
        name === 'user'
          ? 'Peserta'
          : name === 'admin'
            ? 'Super admin'
            : name.charAt(0).toUpperCase() + row.original.name.slice(1)
      const truncateName = rename.length > 25 ? rename.slice(0, 25) + '...' : rename
      return <p className='line-clamp-1 wrap-break-word'>{truncateName}</p>
    },
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi peran',
    minSize: 474,
    maxSize: 474,
    cell: ({ row }) => {
      return (
        <div className='line-clamp-3 wrap-break-word text-ellipsis'>{row.original.description}</div>
      )
    },
  },
  {
    accessorKey: 'permissions',
    header: 'Jumlah izin',
    minSize: 200,
    maxSize: 200,
    accessorFn: ({ permissions, name }) => (name === 'admin' ? 'Semua' : permissions?.length),
  },
  {
    accessorKey: 'action',
    minSize: 100,
    maxSize: 100,
    header: () => {
      return (
        <div className='flex items-center gap-2'>
          Kelola
          <Tooltip>
            <TooltipTrigger className='cursor-pointer'>
              <Icon type='info' className='size-3.5' />
            </TooltipTrigger>
            <TooltipContent className='bg-red-800'>
              <span>
                Kelola peran di sini berfungsi untuk memperbarui izin untuk masing - masing peran.
              </span>
              <ol>
                <li>1. Ikon roda gigi berfungsi untuk memperbarui jumlah izin pada suatu peran</li>
              </ol>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
    enableSorting: false,
    cell: ({ row }) => <ActionColumn {...{ openManage, row }} />,
  },
]
