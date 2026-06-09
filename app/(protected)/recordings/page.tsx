// TODO: implement SSE for realtime update recording status
'use client'

import type { Recording as RecordingDto, RecordingParams } from '@/lib/api/admin-api'
import PageContainer from '@/compounds/page-container'
import path from 'path'
import { TableView } from '@/compounds/table-view'
import { defaultErrorMessage } from '@/config'
import { fetchRecordings, updateRecordingName, deleteRecording } from '@/lib/api/admin-api'
import { mailtoHandler } from '@/feat/recording/helper'
import { recordingColumn } from '@/column/recording'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState, useRef } from 'react'

export default function RecordingsPage() {
  const inputRenameRef = useRef<HTMLFormElement>(null)
  const [recordings, setRecordings] = useState<RecordingDto[]>([])
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [queryParams, setQueryParams] = useState<RecordingParams>({ search: '' })
  const { hasPermission } = useAuth({ requirePermission: 'recording:read' })
  const isSearchNotFound = !!queryParams.search && !recordings.length

  const canUpdate = hasPermission('recording:update')
  const canDelete = hasPermission('recording:delete')

  const getRecordings = async (queryParams?: RecordingParams, signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetchRecordings(queryParams, signal)
      setRecordings(response.filter((rec) => rec.status === 'COMPLETED'))
    } catch (error) {
      if (error instanceof DOMException && error.name == 'AbortError') {
        return
      }
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    getRecordings(queryParams, controller.signal)
    return () => {
      controller.abort()
    }
  }, [queryParams])

  const handleRename = async (id: number, oldName: string, newName: string) => {
    if (!newName) return

    try {
      await updateRecordingName(id, newName)
      setRenamingId(null)
      getRecordings(queryParams)
      toast.success('Berhasil mengganti nama rekaman', {
        description: `Rekaman “${oldName}” menjadi “${newName}”`,
      })
    } catch (error) {
      toast.error('Gagal mengganti nama rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = href
      link.download = `${path.basename(name, path.extname(name)) ?? 'Recording'}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(href)

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
      fetchRecordings(queryParams)
      toast.success('Rekaman berhasil dihapus', {
        description: `Rekaman “${name}” berhasil dihapus`,
      })
    } catch (error) {
      toast.error('Gagal menghapus rekaman', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  const handleMailto = async ({
    url,
    roomName,
    recordName,
  }: {
    url: string
    roomName: string
    recordName: string
  }) => {
    const { success } = await mailtoHandler({
      subject: `Tautan Rekaman Rapat - ${roomName} - ${recordName}`,
      body: url,
    })

    if (!success) {
      toast.error('Gagal bagikan tautan rekaman', {
        description: defaultErrorMessage,
      })
      return
    }

    toast.success('Berhasil bagikan tautan rekaman', {
      description: `Rekaman '${recordName}' berhasil dibagikan dan tautannya telah disalin.`,
    })
  }

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

  const columns = recordingColumn({
    renamingId,
    setRenamingId,
    inputRenameRef,
    canUpdate,
    canDelete,
    handleRename,
    handleDownload,
    handleDelete,
    handleMailto,
  })

  return (
    <PageContainer
      title='Daftar Rekaman'
      subTitle='Kelola setiap rekaman pada tiap rapat'
      icon='recording'
    >
      <TableView
        data={recordings}
        columns={columns}
        search={{
          placeholder: 'Cari nama rekaman ...',
          onSearch: (search) => {
            const updatedParams = { ...queryParams, search }
            setQueryParams(updatedParams)
          },
          'aria-invalid': isSearchNotFound,
        }}
        loading={loading}
      />
    </PageContainer>
  )
}
