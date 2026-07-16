import type { ColumnDef, Getter, Row } from '@tanstack/react-table'
import type { Recording as RecordingDto } from '@/lib/api/admin-api'
import type { ActionButtonProps } from '@/compounds/action-button'
import { useState } from 'react'
import { djs } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { default as ActionButton } from '@/compounds/action-button'
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ActionCompProps = Pick<
  RecordingColumnProps,
  'isAdmin' | 'canManage' | 'handleDownload' | 'handleDelete' | 'handleMailto' | 'handleView'
> & { recordingData: RecordingDto }

type RenameRecordCompProps = Row<RecordingDto> &
  Pick<RecordingColumnProps, 'isAdmin' | 'inputRenameRef' | 'handleRename'> & {
    recordingData: RecordingDto
  }

interface RecordingColumnProps {
  inputRenameRef: React.RefObject<HTMLFormElement | null>
  isAdmin: boolean
  canManage: boolean
  handleRename: (id: number, oldName: string, newName: string) => Promise<void>
  handleDownload: (id: number, name: string) => Promise<void>
  handleDelete: (id: number, name: string) => Promise<void>
  handleMailto: (data: RecordingDto) => Promise<void>
  handleView: (id: number) => Promise<void>
}

const ActionComp = (props: ActionCompProps) => {
  const {
    isAdmin,
    canManage,
    recordingData,
    handleDownload,
    handleDelete,
    handleMailto,
    handleView,
  } = props
  const { id, name } = recordingData
  const [openDelete, setOpenDelete] = useState(false)
  const deleteComp: ActionButtonProps['deleteComp'] = {
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
      onClick: async () => await handleDownload(id, name),
    },
    {
      text: 'Lihat rekaman',
      variant: 'secondary-light',
      icon: <Icon type='detail' />,
      onClick: async () => await handleView(id),
    },
    {
      text: 'Bagikan rekaman',
      variant: 'secondary-light',
      icon: <Icon type='email' />,
      onClick: () => handleMailto(recordingData),
    },
  ]

  return (
    <ActionButton {...(canManage ? { buttonComp } : {})} {...(isAdmin ? { deleteComp } : {})} />
  )
}

const ActionHeader = ({ isAdmin, canManage }: Record<'isAdmin' | 'canManage', boolean>) => {
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
            {canManage && (
              <>
                <li>Ikon Panah berfungsi untuk mengunduh rekaman dalam format mp4</li>
                <li>Ikon mata berfungsi untuk melihat hasil rekaman</li>
                <li>
                  Ikon surat berfungsi untuk mengirim tautan unduh rekaman melalui email
                  masing-masing pengguna dan menyalin ke papan klip
                </li>
              </>
            )}
            {isAdmin && <li>Ikon tempat sampah untuk menghapus rekaman (hanya untuk admin)</li>}
          </ol>
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    </div>
  )
}

const RenameRecordComp = (props: RenameRecordCompProps) => {
  const {
    isAdmin,
    inputRenameRef,
    handleRename,
    getToggleSelectedHandler,
    getIsSelected,
    original: data,
  } = props
  const { id, name } = data
  const isSelected = getIsSelected()

  if (!isSelected) {
    return (
      <div className='flex items-center gap-2 font-medium'>
        <span>{name.length > 25 ? `${name.slice(0, 25)}...` : name}</span>
        {isAdmin && (
          <Button
            onClick={getToggleSelectedHandler()}
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
        await handleRename(id, name, newName.trim())
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
  inputRenameRef,
  isAdmin,
  canManage,
  handleRename,
  handleDownload,
  handleDelete,
  handleMailto,
  handleView,
}: RecordingColumnProps): ColumnDef<RecordingDto>[] => [
  {
    accessorKey: 'name',
    header: 'Nama rekaman',
    cell: ({ row }) => (
      <RenameRecordComp
        {...row}
        {...{ isAdmin, handleRename, inputRenameRef }}
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
    header: () => <ActionHeader {...{ isAdmin, canManage }} />,
    enableSorting: false,
    cell: ({ row }) => {
      const { status } = row.original
      if (status !== 'COMPLETED') {
        return <Badge variant='destructive'>Record in Progress</Badge>
      }
      return (
        <ActionComp
          {...{ isAdmin, canManage, handleDelete, handleDownload, handleMailto, handleView }}
          recordingData={row.original}
        />
      )
    },
  },
]
