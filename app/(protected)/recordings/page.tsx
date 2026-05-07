'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  RefreshCcw,
  Pencil,
  Link2,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
} from 'lucide-react'
import {
  fetchRecordings,
  syncRecordings,
  updateRecordingName,
  deleteRecording,
  type Recording as RecordingDto,
} from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'

/**
 * Recordings page component that fetches and displays a list of recordings grouped by room.
 * It provides functionalities to rename, download, and delete recordings.
 * Additionally, it polls for the processing status of extracting recordings.
 *
 * @returns {JSX.Element} The rendered recordings page interface.
 */
export default function RecordingsPage() {
  const { hasPermission } = useAuth({ requirePermission: 'recording:read' })
  const [recordings, setRecordings] = useState<RecordingDto[]>([])
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [val, setVal] = useState('')
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})

  const [progressMap, setProgressMap] = useState<Record<string, number>>({})

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
              } catch (e) {}
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

  const handleRename = async (id: number) => {
    if (val) {
      await updateRecordingName(id, val)
      setRenamingId(null)
      load()
    }
  }

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

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: prev[roomId] === undefined ? false : !prev[roomId],
    }))
  }

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

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-semibold'>Recordings</h2>
        <Button variant='outline' size='sm' onClick={load} className='h-8 text-xs'>
          <RefreshCcw className='mr-2 h-3 w-3' /> Refresh
        </Button>
      </div>

      {recordings.length === 0 ? (
        <div className='bg-card border-border text-muted-foreground overflow-hidden rounded-lg border p-8 text-center text-sm shadow-sm'>
          No recordings found
        </div>
      ) : (
        <div className='space-y-4'>
          {Object.entries(groupedRecordings).map(([roomId, roomRecordings]) => {
            const isExpanded = expandedRooms[roomId] !== false
            return (
              <div
                key={roomId}
                className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'
              >
                <button
                  onClick={() => toggleRoom(roomId)}
                  className='bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between p-4 transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <Folder className='text-primary h-4 w-4' />
                    <span className='text-sm font-medium'>Room: {roomId}</span>
                    <span className='bg-primary/10 text-primary ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium'>
                      {roomRecordings.length}{' '}
                      {roomRecordings.length === 1 ? 'recording' : 'recordings'}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className='text-muted-foreground h-4 w-4' />
                  ) : (
                    <ChevronRight className='text-muted-foreground h-4 w-4' />
                  )}
                </button>

                {isExpanded && (
                  <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm'>
                      <thead className='bg-muted border-border text-muted-foreground border-y border-b text-xs font-medium uppercase'>
                        <tr>
                          <th className='px-5 py-3'>Name</th>
                          <th className='px-5 py-3'>Date</th>
                          <th className='px-5 py-3'>Status</th>
                          <th className='px-5 py-3 text-right'>Action</th>
                        </tr>
                      </thead>
                      <tbody className='divide-border/70 divide-y'>
                        {roomRecordings.map((r) => (
                          <tr key={r.id} className='hover:bg-muted/50'>
                            <td className='px-5 py-3'>
                              {renamingId === r.id ? (
                                <div className='flex gap-2'>
                                  <Input
                                    className='h-7 text-xs'
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    autoFocus
                                  />
                                  <Button
                                    size='sm'
                                    className='h-7'
                                    onClick={() => handleRename(r.id)}
                                  >
                                    ✓
                                  </Button>
                                </div>
                              ) : (
                                <div className='flex items-center gap-2 font-medium'>
                                  {r.name}
                                  {canUpdate && (
                                    <button
                                      onClick={() => {
                                        setRenamingId(r.id)
                                        setVal(r.name)
                                      }}
                                      className='text-muted-foreground hover:text-primary'
                                    >
                                      <Pencil className='h-3 w-3' />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className='text-muted-foreground px-5 py-3 text-xs'>
                              {new Date(r.created_at).toLocaleString()}
                            </td>
                            <td className='flex items-center gap-2 px-5 py-3 text-xs'>
                              {r.status === 'PROCESSING' ? (
                                <>
                                  <Loader2 className='text-primary h-4 w-4 animate-spin' />
                                  <span className='text-primary animate-pulse font-medium'>
                                    Extracting ({progressMap[r.egress_id] ?? 0}%)
                                  </span>
                                </>
                              ) : (
                                <span className='font-medium text-green-600'>Ready</span>
                              )}
                            </td>
                            <td className='px-5 py-3 text-right'>
                              <div className='flex justify-end gap-2'>
                                {r.status !== 'PROCESSING' && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleDownload(
                                          r.link,
                                          r.name.includes('.mp4') ? r.name : `${r.name}.mp4`
                                        )
                                      }
                                      className='text-primary hover:bg-primary/10 rounded p-1.5'
                                      title='Download'
                                    >
                                      <Download className='h-3.5 w-3.5' />
                                    </button>
                                    <a
                                      href={r.link}
                                      target='_blank'
                                      className='text-primary hover:bg-primary/10 rounded p-1.5'
                                      title='Open Link'
                                    >
                                      <Link2 className='h-3.5 w-3.5' />
                                    </a>
                                  </>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={async () => {
                                      if (confirm('Delete?')) {
                                        await deleteRecording(r.id)
                                        load()
                                      }
                                    }}
                                    className='text-destructive hover:bg-destructive/10 rounded p-1.5'
                                    title='Delete'
                                  >
                                    <Trash2 className='h-3.5 w-3.5' />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
