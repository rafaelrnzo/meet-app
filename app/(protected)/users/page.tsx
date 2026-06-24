'use client'

import type { UserParams, UserPrensence } from '@/feat/users/dto'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useParticipants } from '@/feat/users/useParticipants'
import { TableViewHeader } from '@/compounds/table-view/header'
import { TableView } from '@/compounds/table-view'
import { default as PageContainer } from '@/compounds/page-container'
import { usersColumn } from '@/column/users'

export default function UsersPage() {
  // State
  const [queryParams, setQueryParams] = useState({
    page: 1,
    search: '',
    presence: 'all' as UserParams['presence'],
  })

  // Hooks
  const { users, isLoading, refetchUsers, refetchRoles } = useParticipants()

  // Permissions
  const { loading: authLoading } = useAuth({ requirePermission: 'user:read' })

  // Handler & Computed
  const filteredUsers = useMemo(() => {
    if (!queryParams.search.trim()) return users.data

    const lower = queryParams.search.toLowerCase()

    return users.data.filter((user) => user.username.toLowerCase().includes(lower))
  }, [users.data, queryParams.search])

  useEffect(() => {
    refetchUsers(queryParams)
  }, [queryParams, refetchUsers])

  useEffect(() => {
    refetchRoles()
  }, [refetchRoles])

  // Column
  const columns = useMemo(() => usersColumn(), [])

  return (
    <PageContainer
      icon='users'
      title='Daftar Peserta'
      subTitle='Kelola setiap peserta badiklat'
      backToTopButton
    >
      <TableViewHeader
        headerAddon={<p className='font-semibold text-red-800'> {users.total} Daftar Peserta</p>}
        search={{
          placeholder: 'Cari peserta ...',
          onSearch: (search) => setQueryParams((prev) => ({ ...prev, page: 1, search })),
          'aria-invalid': false,
        }}
        filter={{
          placeholder: 'Status',
          options: [
            {
              value: 'all',
              label: 'Semua',
            },
            {
              value: 'waiting',
              label: 'Menunggu Persetujuan',
            },
            {
              value: 'banned',
              label: 'Diblokir',
            },
          ],
          selectProps: {
            select: {
              value: queryParams.presence,
              onValueChange: (presence: UserPrensence) => {
                setQueryParams((prev) => ({
                  ...prev,
                  page: 1,
                  presence,
                }))
              },
            },
          },
        }}
      />
      <TableView data={filteredUsers} columns={columns} loading={isLoading || authLoading} />
    </PageContainer>
  )
}
