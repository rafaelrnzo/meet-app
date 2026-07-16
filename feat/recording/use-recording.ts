'use client'

import type { RowSelectionState } from '@tanstack/react-table'
import type { Recording, RecordingParams } from '@/lib/api/admin-api'
import type { RecordingSSEDTO } from './dto'
import { useEffect, useMemo, useRef, useState } from 'react'
import { default as path } from 'path'
import { mailtoHandler } from './helper'
import { RecordingEvent } from './dto'
import { djs, qstring } from '@/lib/utils'
import {
  deleteRecording,
  fetchRecordings,
  fetchRecordingVideo,
  updateRecordingName,
} from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { defaultErrorMessage } from '@/config'
import { toast } from '@/components/ui/sonner'

type CreateURL = { blob: Blob; isDownload?: false } | { blob: Blob; isDownload: true; name: string }

export const useRecording = () => {
  const { loading: authLoading, token, publicUrl } = useAuth()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [queryParams, setQueryParams] = useState<RecordingParams>({ search: '' })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const inputRenameRef = useRef<HTMLFormElement>(null)
  const recordURL = useRef<string>(null)

  const getRecordings = async () => {
    try {
      setIsLoading(true)
      const response = await fetchRecordings()
      setRecordings(response)
    } catch {
      setRecordings([])
    } finally {
      setIsLoading(false)
    }
  }

  const createURL = (props: CreateURL) => {
    if (recordURL.current) {
      URL.revokeObjectURL(recordURL.current)
      recordURL.current = null
    }

    const href = URL.createObjectURL(props.blob)
    recordURL.current = href
    const link = document.createElement('a')

    link.href = href

    if (props.isDownload) {
      link.download = `${path.basename(props.name, path.extname(props.name)) ?? 'Recording'}.mp4`
    } else {
      link.target = '_blank'
    }

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = async (id: number) => {
    try {
      const blob = await fetchRecordingVideo(id)
      createURL({ blob })
    } catch (error) {
      toast.error('Gagal melihat hasil rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleSearch = (search: string) => {
    const searchLower = search.toLowerCase()
    setQueryParams((prev) => ({ ...prev, search: searchLower }))
  }

  const resetRowSelection = () => {
    setRowSelection({})
  }

  const handleRename = async (id: number, oldName: string, newName: string) => {
    if (!newName) return

    if (oldName === newName) return resetRowSelection()

    try {
      await updateRecordingName(id, newName)
      resetRowSelection()
      getRecordings()
      toast.success('Berhasil mengganti nama rekaman', {
        description: `Rekaman “${oldName}” menjadi “${newName}”`,
      })
    } catch (error) {
      toast.error('Gagal mengganti nama rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleDownload = async (id: number, name: string) => {
    try {
      const blob = await fetchRecordingVideo(id)
      createURL({
        blob,
        isDownload: true,
        name: `${path.basename(name, path.extname(name)) ?? 'Recording'}.mp4`,
      })
      toast.success('Berhasil unduh rekaman', {
        description: `Rekaman “${name}” berhasil diunduh`,
      })
    } catch (error) {
      toast.error('Gagal unduh rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteRecording(id)
      toast.success('Rekaman berhasil dihapus', {
        description: `Rekaman “${name}” berhasil dihapus`,
      })
    } catch (error) {
      toast.error('Gagal menghapus rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleMailto = async ({ room_name, link, name, created_at }: Recording) => {
    const { success } = await mailtoHandler({
      subject: `Meeting Recording_${room_name}_${djs(created_at).format('DD/MM/YYYY')}_${djs(created_at).format('HH:mm:ss')}`,
      body: link,
    })

    if (!success) {
      toast.error('Gagal bagikan tautan rekaman', {
        description: defaultErrorMessage,
      })
      return
    }

    toast.success('Berhasil bagikan tautan rekaman', {
      description: `Rekaman '${name}' berhasil dibagikan dan tautannya telah disalin.`,
    })
  }

  useEventSource<RecordingSSEDTO>({
    eventUrl: qstring(`${publicUrl}/admin/recordings/events`, { token }),
    onMessage: (event) => {
      if (
        [
          RecordingEvent.Created,
          RecordingEvent.StatusUpdate,
          RecordingEvent.Rename,
          RecordingEvent.Delete,
        ].includes(event.type)
      ) {
        getRecordings()
      }
    },
  })

  // handle click outside input rename
  useEffect(() => {
    const handleClickOutsideRename = (event: MouseEvent | TouchEvent) => {
      if (!inputRenameRef.current) return

      if (event.target instanceof Node && !inputRenameRef.current.contains(event.target)) {
        setRowSelection({})
      }
    }

    document.addEventListener('mousedown', handleClickOutsideRename)
    document.addEventListener('touchstart', handleClickOutsideRename)

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRename)
      document.removeEventListener('touchstart', handleClickOutsideRename)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      getRecordings()
    }
  }, [authLoading])

  const filteredRecordings = useMemo(() => {
    const search = queryParams.search
    if (!search) return recordings

    return recordings.filter((rec) => {
      const nameLower = rec.name.toLowerCase()
      return nameLower.startsWith(search) || nameLower.includes(search)
    })
  }, [queryParams.search, recordings])

  const isSearchNotFound = !!queryParams.search && !recordings.length

  return {
    inputRenameRef,
    isLoading,
    isSearchNotFound,
    recordings: filteredRecordings,
    rowSelection,
    setRowSelection,
    handleDelete,
    handleDownload,
    handleMailto,
    handleRename,
    handleSearch,
    handleView,
  }
}
