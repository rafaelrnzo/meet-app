import type { ColumnDef, Getter } from '@tanstack/react-table'
import type { Recording as RecordingDto } from '@/lib/api/admin-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar1, Check, Download, Eye, Loader2, Mail, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { djs } from '@/lib/utils'
import { ModalDelete } from '@/components/ui/modal'
import { useState } from 'react'

type DeleteRecordingProps = Pick<
  RecordingColumnProps,
  'handleDownload' | 'canDelete' | 'handleDelete'
> & { recordingData: RecordingDto }

interface RecordingColumnProps {
  renamingId: number | null
  setRenamingId: React.Dispatch<number | null>
  inputRenameRef: React.RefObject<HTMLDivElement | null>
  canUpdate: boolean
  canDelete: boolean
  handleRename: (id: number, value: string) => void
  handleDownload: (url: string, filename: string) => void
  handleDelete: (id: number) => Promise<void>
  progressMap: Record<string, number>
}

const ActionButton = (props: DeleteRecordingProps) => {
  const { handleDownload, canDelete, handleDelete, recordingData } = props
  const { link, name, id, status } = recordingData
  const [open, onOpenChange] = useState(false)

  return (
    <div className='flex items-center gap-2'>
      {status !== 'PROCESSING' && (
        <>
          <Button
            onClick={() => handleDownload(link, name.includes('.mp4') ? name : `${name}.mp4`)}
            title='Download'
            variant='secondary-light'
            size='icon-xs'
          >
            <Download size={16} />
          </Button>
          <Button title='Preview' asChild variant='secondary-light' size='icon-xs'>
            <Link href={link} target='_blank'>
              <Eye size={16} />
            </Link>
          </Button>
        </>
      )}

      <Button
        onClick={() => {
          /* empty */
        }}
        title='Share to mail'
        variant='secondary-light'
        size='icon-xs'
      >
        <Mail size={16} />
      </Button>

      {canDelete && (
        <ModalDelete
          root={{ open, onOpenChange }}
          trigger={{
            asChild: true,
            children: (
              <Button title='Delete' variant='destructive-light' size='icon-xs'>
                <Trash2 size={16} />
              </Button>
            ),
          }}
          title={{
            children: 'Delete Recording?',
          }}
          submit={{
            children: (
              <>
                <Trash2 />
                Delete Recording
              </>
            ),
            onClick: async () => {
              await handleDelete(id)
              onOpenChange(false)
            },
          }}
        >
          This action will permanently delete this recording and all related data. This cannot be
          undone.
        </ModalDelete>
      )}
    </div>
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
  progressMap,
}: RecordingColumnProps): ColumnDef<RecordingDto>[] => [
  {
    accessorKey: 'name',
    header: 'Recording Name',
    cell: ({ row }) => {
      const id = row.original.id
      const name = row.original.name
      // TODO: fix this
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [recordingName, setRecordingName] = useState(name)

      return renamingId === id ? (
        <div className='relative' ref={inputRenameRef}>
          <Input
            className='h-7 text-sm'
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            autoFocus
          />
          <Button
            size='sm'
            className='absolute top-1/2 right-0 h-fit -translate-y-1/2 cursor-pointer text-green-500 hover:bg-transparent hover:text-green-600'
            onClick={() => handleRename(id, recordingName)}
            variant='ghost'
          >
            <Check size={16} />
          </Button>
        </div>
      ) : (
        <div className='flex items-center gap-2 font-medium'>
          {name}
          {canUpdate && (
            <Button
              onClick={() => {
                setRenamingId(id)
                setRecordingName(name)
              }}
              variant='ghost'
              className='group h-fit cursor-pointer border border-neutral-400 p-1! hover:border-slate-950 hover:bg-slate-950'
            >
              <Pencil
                size={16}
                className='fill-neutral-950 stroke-white group-hover:fill-white group-hover:stroke-neutral-950'
              />
            </Button>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Recording Date',
    accessorFn: ({ created_at }) => djs(created_at).format('DD MMMM YYYY'),
    cell: ({ getValue }: { getValue: Getter<string> }) => {
      return (
        <div className='flex items-center gap-1'>
          <Calendar1 size={16} /> {getValue()}
        </div>
      )
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const egressId = row.original.egress_id

      return status === 'PROCESSING' ? (
        <>
          <Loader2 className='text-primary h-4 w-4 animate-spin' />
          <span className='text-primary animate-pulse font-medium'>
            Extracting ({progressMap[egressId] ?? 0}%)
          </span>
        </>
      ) : (
        <span className='font-medium text-green-600'>Ready</span>
      )
    },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => (
      <ActionButton {...{ canDelete, handleDelete, handleDownload }} recordingData={row.original} />
    ),
  },
]
