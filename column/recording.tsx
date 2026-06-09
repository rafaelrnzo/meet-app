import type { ActionButtonProps } from '@/compounds/action-button'
import type { ColumnDef, Getter } from '@tanstack/react-table'
import type { Recording as RecordingDto } from '@/lib/api/admin-api'
import ActionButton from '@/compounds/action-button'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { djs } from '@/lib/utils'
import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useIsMobile } from '@/hooks/use-mobile'

type ActionCompProps = Pick<
  RecordingColumnProps,
  'handleDownload' | 'canDelete' | 'handleDelete' | 'handleMailto'
> & { recordingData: RecordingDto }

type RenameRecordCompProps = Pick<
  RecordingColumnProps,
  'renamingId' | 'canUpdate' | 'setRenamingId' | 'inputRenameRef' | 'handleRename'
> & {
  recordingData: RecordingDto
}

interface RecordingColumnProps {
  renamingId: number | null
  setRenamingId: React.Dispatch<number | null>
  inputRenameRef: React.RefObject<HTMLFormElement | null>
  canUpdate: boolean
  canDelete: boolean
  handleRename: (id: number, oldName: string, newName: string) => Promise<void>
  handleDownload: (url: string, name: string) => Promise<void>
  handleDelete: (id: number, name: string) => Promise<void>
  handleMailto: (data: RecordingDto) => Promise<void>
}

const ActionComp = (props: ActionCompProps) => {
  const { canDelete, recordingData, handleDownload, handleDelete, handleMailto } = props
  const { id, name, link } = recordingData
  const [openDelete, setOpenDelete] = useState(false)
  const deleteComponent: ActionButtonProps['deleteComp'] = {
    root: {
      open: openDelete,
      onOpenChange: setOpenDelete,
    },
    title: {
      children: 'Hapus rekaman?',
    },
    description: {
      children:
        'Tindakan ini akan menghapus rekaman ini dan semua data terkait secara permanen. Tindakan ini tidak dapat dibatalkan.',
    },
    submit: {
      children: 'Hapus rekaman',
      onClick: async () => {
        await handleDelete(id, name)
        setOpenDelete(false)
      },
    },
    trigger: {
      text: 'Hapus rekaman',
    },
    content: {
      onInteractOutside: (event) => event.preventDefault(),
      onPointerDownOutside: (event) => event.preventDefault(),
    },
  }
  const buttonComp: ActionButtonProps['buttonComp'] = [
    {
      text: 'Unduh rekaman',
      variant: 'secondary-light',
      icon: <Icon type='download' />,
      onClick: async () => await handleDownload(link, name),
    },
    {
      variant: 'secondary-light',
      children: (
        <Link href={link} target='_blank' className='flex items-center gap-2'>
          <Icon type='detail' />
          <span className='md:hidden'>Lihat rekaman</span>
        </Link>
      ),
    },
    {
      text: 'Bagikan rekaman',
      variant: 'secondary-light',
      icon: <Icon type='email' />,
      onClick: () => handleMailto(recordingData),
    },
  ]

  return (
    <ActionButton buttonComp={buttonComp} {...(canDelete ? { deleteComp: deleteComponent } : {})} />
  )
}

const ActionHeader = () => {
  const isMobile = useIsMobile()
  const [open, onOpenChange] = useState(false)
  const toggleOpen = () => {
    onOpenChange((prev) => !prev)
  }
  return (
    <div className='flex items-center gap-2.5'>
      <span>Kelola</span>
      <Popover open={open} onOpenChange={isMobile ? onOpenChange : void 0} modal={isMobile}>
        <PopoverTrigger
          onMouseEnter={isMobile ? void 0 : toggleOpen}
          onMouseLeave={isMobile ? void 0 : toggleOpen}
          className='focus-visible:outline-none'
        >
          <Icon type='info' />
        </PopoverTrigger>
        <PopoverContent
          className='w-full max-w-dvw bg-red-800 px-2 py-1 text-xs text-slate-50 data-[state=closed]:animate-none! data-[state=open]:animate-none!'
          side='bottom'
          align='center'
        >
          <ol className='list-inside list-decimal'>
            <li>Ikon Panah berfungsi untuk mengunduh rekaman dalam format mp4</li>
            <li>Ikon mata berfungsi untuk melihat hasil rekaman</li>
            <li>
              Ikon surat berfungsi untuk mengirim tautan unduh rekaman melalui email masing-masing
              pengguna dan menyalin ke papan klip
            </li>
            <li>Ikon tempat sampah untuk menghapus rekaman (hanya untuk admin)</li>
          </ol>
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const RenameRecordComp = (props: RenameRecordCompProps) => {
  const { recordingData, renamingId, canUpdate, setRenamingId, inputRenameRef, handleRename } =
    props
  const { id, name } = recordingData

  if (renamingId !== id) {
    return (
      <div className='flex items-center gap-2 font-medium'>
        <span>{name.length > 25 ? `${name.slice(0, 25)}...` : name}</span>
        {canUpdate && (
          <Button
            onClick={() => setRenamingId(id)}
            variant='secondary'
            size='icon-xs'
            className='p-0'
          >
            <Icon type='pencil' />
          </Button>
        )}
      </div>
    )
  }

  return (
    <form
      className='relative'
      ref={inputRenameRef}
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const newName = data.get('name')
        if (!newName || typeof newName !== 'string') return
        await handleRename(id, name, newName)
      }}
    >
      <InputGroup>
        <InputGroupInput id='name' name='name' defaultValue={name} autoFocus />
        <InputGroupAddon align='inline-end'>
          <Button
            variant='ghost'
            className='text-success hover:bg-transparent hover:text-green-600'
            type='submit'
          >
            <Icon type='check' className='fill-transparent stroke-0' />
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

export const recordingColumn = ({
  renamingId,
  setRenamingId,
  inputRenameRef,
  canUpdate,
  canDelete,
  handleRename,
  handleDownload,
  handleDelete,
  handleMailto,
}: RecordingColumnProps): ColumnDef<RecordingDto>[] => [
  {
    accessorKey: 'name',
    header: 'Nama rekaman',
    cell: ({ row }) => (
      <RenameRecordComp
        {...{ canUpdate, handleRename, inputRenameRef, renamingId, setRenamingId }}
        recordingData={row.original}
      />
    ),
    maxSize: 250,
    minSize: 200,
  },
  {
    accessorKey: 'room_name',
    header: 'Nama ruangan',
    maxSize: 200,
    minSize: 200,
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal direkam',
    accessorFn: ({ created_at }) => djs(created_at).format('DD MMMM YYYY, HH:mm:ss'),
    cell: ({ getValue }: { getValue: Getter<string> }) => {
      return (
        <div className='flex items-center gap-2'>
          <Icon type='calendar' className='text-neutral-400' /> {getValue()}
        </div>
      )
    },
    minSize: 200,
  },
  {
    accessorKey: 'action',
    header: () => <ActionHeader />,
    enableSorting: false,
    cell: ({ row }) => {
      const { status } = row.original
      if (status === 'PROCESSING') {
        return <Badge variant='destructive'>Record in Progress</Badge>
      }
      return (
        <ActionComp
          {...{ canDelete, canUpdate, handleDelete, handleDownload, handleMailto }}
          recordingData={row.original}
        />
      )
    },
  },
]
