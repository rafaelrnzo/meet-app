'use client'

import PageContainer from '@/compounds/page-container'
import { cn } from '@/lib/utils'
import { recordingColumn } from '@/column/recording'
import { TableView } from '@/compounds/table-view'
import { useAuth } from '@/hooks/use-auth'
import { useRecording } from '@/feat/recording/use-recording'

export default function RecordingsPage() {
  const {
    inputRenameRef,
    isLoading,
    isSearchNotFound,
    recordings,
    rowSelection,
    setRowSelection,
    handleDelete,
    handleDownload,
    handleMailto,
    handleRename,
    handleSearch,
  } = useRecording()
  const { isAdmin, hasPermission } = useAuth({ requirePermission: 'module:recordings:access' })
  const canManage = hasPermission('recording:manage')
  const columns = recordingColumn({
    inputRenameRef,
    isAdmin,
    canManage,
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
          onSearch: (search) => handleSearch(search),
          'aria-invalid': isSearchNotFound,
        }}
        loading={isLoading}
        state={{
          columnVisibility: {
            action: isAdmin || canManage,
          },
          rowSelection,
        }}
        headerAddon={
          <span
            className={cn('text-base font-semibold text-red-800', !isSearchNotFound && 'hidden')}
          >
            0 Daftar Rekaman
          </span>
        }
        enableMultiRowSelection={false}
        onRowSelectionChange={setRowSelection}
      />
    </PageContainer>
  )
}
