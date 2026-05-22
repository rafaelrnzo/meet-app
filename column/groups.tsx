'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import ActionButton from '@/compounds/action-button'
import type { Group } from '@/lib/api/admin-api'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { Info, Settings, Users } from 'lucide-react'

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
          icon: <Settings />,
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
          disabled: !is_editable,
        },
      }}
      // switchComp={{
      //   checked,
      //   setChecked,
      //   modal: {
      //     submit: {
      //       children: 'Nonaktifkan Pengguna',
      //       onClick: () => setChecked(false),
      //     },
      //     title: {
      //       children: 'Non-aktifkan pengguna',
      //     },
      //     description: {
      //       children:
      //         'Tindakan ini akan menonaktifkan dan memaksa anggota agar keluar dari ruang rapat dan dashboard sementara waktu sampai Anda aktifkan kembali. Anda dapat kembali mengaktifkannya kembali dengan cara yang sama.',
      //     },
      //   },

      //   text: {
      //     active: 'Anggota aktif',
      //     inactive: 'Anggota tidak aktif',
      //   },
      // }}
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
      return (
        <div className='flex flex-row items-center gap-2'>
          <Users className='size-5 fill-red-800' />
          <p className='w-[250px] max-w-[250px] font-medium text-neutral-950'>
            {row.original.name}
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
    accessorFn: ({ description }) => description,
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
            <TooltipTrigger asChild className='cursor-pointer'>
              <Info className='size-3.5' />
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
