'use client'

import type { Recording as RecordingDto } from '@/lib/api/admin-api'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Play, Search } from 'lucide-react'
import {
  fetchRecordings,
  syncRecordings,
  updateRecordingName,
  deleteRecording,
} from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import { TableView } from '@/compounds/table-view'
import { recordingColumn } from '@/column/recording'
import { cn } from '@/lib/utils'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
/**
 * Recordings page component that fetches and displays a list of recordings grouped by room.
 * It provides functionalities to rename, download, and delete recordings.
 * Additionally, it polls for the processing status of extracting recordings.
 *
 * @returns {JSX.Element} The rendered recordings page interface.
 */
export default function RecordingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { hasPermission } = useAuth({ requirePermission: 'recording:read' })
  const [recordings, setRecordings] = useState<RecordingDto[]>([])
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(
    searchParams.get('room') || null
  )
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const inputRenameRef = useRef<HTMLDivElement | null>(null)

  const canUpdate = hasPermission('recording:update')
  const canDelete = hasPermission('recording:delete')

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const processingRecordings = recordings.filter((r) => r.status === 'PROCESSING')
    if (processingRecordings.length === 0) return

    const interval = setInterval(() => {
      processingRecordings.forEach((r) => {
        fetch(`http://localhost:4000/progress/${r.egress_id}`)
          .then((res) => res.json())
          .then(async (data) => {
            if (data.progress !== undefined) {
              setProgressMap((prev) => ({ ...prev, [r.egress_id]: data.progress }))
            }
            if (data.status === 'COMPLETED') {
              try {
                const { updateRecordingStatus } = await import('@/lib/api/admin-api')
                await updateRecordingStatus(r.id, 'COMPLETED')
              } catch (e) {
                console.error('Failed to update status in DB', e)
              }
              load()
            } else if (data.status === 'ERROR') {
              try {
                const { updateRecordingStatus } = await import('@/lib/api/admin-api')
                await updateRecordingStatus(r.id, 'ERROR')
              } catch {
                /* empty */
              }
              load()
            }
          })
          .catch((e) => console.error('Poll failed', e))
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [recordings])

  const load = async () => {
    await syncRecordings()
    setRecordings((await fetchRecordings()) || [])
  }

  const handleRename = useCallback(async (id: number, value: string) => {
    if (value) {
      await updateRecordingName(id, value)
      setRenamingId(null)
      load()
    }
  }, [])

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename || 'recording.mp4'

      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(url, '_blank')
    }
  }

  const handleDelete = useCallback(async (id: number) => {
    await deleteRecording(id)
    load()
  }, [])

  const groupedRecordings = useMemo(() => {
    return recordings.reduce(
      (acc, current) => {
        const roomId = current.room_id || 'Unknown Room'
        if (!acc[roomId]) {
          acc[roomId] = []
        }
        acc[roomId].push(current)
        return acc
      },
      {} as Record<string, RecordingDto[]>
    )
  }, [recordings])

  // handle click outside input rename
  useEffect(() => {
    const handleClickOutsideRename = (event: MouseEvent | TouchEvent) => {
      if (!inputRenameRef.current) return

      if (event.target instanceof Node && !inputRenameRef.current.contains(event.target)) {
        setRenamingId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutsideRename)
    document.addEventListener('touchstart', handleClickOutsideRename)

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRename)
      document.removeEventListener('touchstart', handleClickOutsideRename)
    }
  }, [])

  const columns = useMemo(
    () =>
      recordingColumn({
        renamingId,
        setRenamingId,
        inputRenameRef,
        canUpdate,
        canDelete,
        handleRename,
        handleDownload,
        handleDelete,
        progressMap,
      }),
    [canDelete, canUpdate, handleDelete, handleRename, progressMap, renamingId]
  )

  return (
    <div className='space-y-8'>
      {/* title */}
      <div className='flex items-center gap-2 rounded-md bg-red-100 p-6'>
        <div className='size-10 rounded-md border border-red-800 bg-red-50 p-2.5'>
          <div className='flex size-4.5 items-center justify-center rounded-full bg-red-800 p-1'>
            <Play className='size-4.5 fill-white text-white' />
          </div>
        </div>
        <div className='flex flex-col leading-5.25'>
          <span className='font-semibold text-red-800'>Recordings</span>
          <span className='text-sm'>List of recorded room</span>
        </div>
      </div>

      {/* search */}
      <div className='px-6'>
        <div className='relative'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400' />
          <Input
            type='search'
            placeholder='Search recording ..'
            className='border border-neutral-400 py-1 pr-3 pl-9 md:w-75'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className='bg-card border-border text-muted-foreground overflow-hidden rounded-lg border p-8 text-center text-sm shadow-sm'>
          No recordings found
        </div>
      ) : (
        <div className='space-y-8'>
          {Object.entries(groupedRecordings).map(([roomId, roomRecordings]) => {
            const isExpanded = expandedRoomId === roomId
            const Icon = isExpanded ? ChevronDown : ChevronUp

            return (
              <div key={roomId} className='bg-card overflow-hidden rounded-md'>
                <button
                  onClick={() => {
                    router.push(isExpanded ? pathname : `${pathname}?room=${roomId}`, {
                      scroll: false,
                    })
                    setExpandedRoomId((prev) => (prev === roomId ? null : roomId))
                  }}
                  className={cn(
                    'hover:bg-muted/50 flex w-full items-center justify-between rounded-t-md border bg-white py-[12.5px] pr-6 pl-2 transition-colors',
                    !isExpanded && 'rounded-b-md'
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Room: {roomId}</span>
                    <Badge
                      variant='secondary'
                      className='rounded-md border-neutral-400 bg-neutral-200 font-normal text-neutral-800 italic'
                    >
                      {`${roomRecordings.length} recording${roomRecordings.length > 1 ? 's' : ''}`}
                    </Badge>
                  </div>
                  <Icon className='h-4 w-4 text-neutral-950' />
                </button>

                {isExpanded && (
                  <div className='overflow-x-auto pb-1'>
                    <TableView
                      data={roomRecordings}
                      columns={columns}
                      wrapper={{
                        className: 'rounded-t-none',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
