'use client'

import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { Group } from '@/lib/api/admin-api'
import { default as ActionButton } from '@/compounds/action-button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Icon } from '@/components/ui/icon'

interface GroupsColumnProps {
  handleDelete: ({ id, name }: { id: number; name: string }) => void
  openManage: (e: Group) => void
}

interface ActionButtonProps extends GroupsColumnProps {
  row: CellContext<Group, unknown>['row']
}

const ActionColumn = (props: ActionButtonProps) => {
  const { handleDelete, openManage, row } = props
  const { id, name, is_editable } = row.original
  return (
    <ActionButton
      buttonComp={[
        {
          text: 'Kelola Kelompok',
          variant: 'secondary-light',
          icon: <Icon type='settings' />,
          onClick: () => openManage(row.original),
          disabled: !is_editable,
        },
      ]}
      deleteComp={{
        title: {
          children: 'Hapus Kelompok?',
        },
        submit: {
          children: 'Hapus Kelompok',
          onClick: () => handleDelete({ id: Number(id), name }),
        },
        description: {
          children:
            'Tindakan ini akan menghapus grup ini dan semua data terkait secara permanen. Tindakan ini tidak dapat dibatalkan.',
        },
        trigger: {
          text: 'Hapus Kelompok',
          disabled: !is_editable,
        },
      }}
    />
  )
}

export const groupsColumn = ({
  handleDelete,
  openManage,
}: GroupsColumnProps): ColumnDef<Group>[] => [
  {
    accessorKey: 'name',
    header: 'Nama kelompok',
    minSize: 250,
    maxSize: 250,
    cell: ({ row }) => {
      const name = row.original.name
      const truncateName = name.length > 25 ? name.slice(0, 25) + '...' : name
      return (
        <div className='flex flex-row items-center gap-2'>
          <Icon type='users' className='text-red-800' size={20} />
          <p className='line-clamp-1 font-medium wrap-break-word text-neutral-950'>
            {truncateName}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi kelompok',
    minSize: 474,
    maxSize: 474,
    cell: ({ row }) => {
      return (
        <div className='line-clamp-3 wrap-break-word text-ellipsis'>{row.original.description}</div>
      )
    },
  },
  {
    accessorKey: 'members',
    header: 'Jumlah peserta',
    minSize: 200,
    maxSize: 200,
    accessorFn: ({ members }) => members?.length,
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
              <ol type='1'>
                <li>1. Ikon roda gigi untuk mengelola pengguna pada kelompok</li>
                <li>2. Ikon tempat sampah untuk menghapus kelompok</li>
              </ol>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
    enableSorting: false,
    cell: ({ row }) => <ActionColumn {...{ handleDelete, openManage, row }} />,
  },
]
