'use client'

import { useEffect, useMemo, useState } from 'react'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { usersColumn } from '@/column/users'
import { TableViewHeader } from '@/compounds/table-view/header'
import { useParticipants } from '@/feat/users/useParticipants'
import type { UserParams, UserPrensence } from '@/feat/users/dto'
import { useAuth } from '@/hooks/use-auth'

export default function UsersPage() {
  // State
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    presence: 'all' as UserParams['presence'],
  })

  // Hooks
  const { loading: authLoading } = useAuth({ requirePermission: 'user:read' })
  const { users, isLoading, refetchUsers, refetchRoles } = useParticipants()

  // Permissions
  // TODO: Implement permissions for create, update, delete actions
  // const { hasPermission } = useAuth({ requirePermission: 'user:read' })
  // const canCreate = hasPermission('user:create')
  // const canUpdate = hasPermission('user:update')
  // const canDelete = hasPermission('user:delete')

  // Handler & Computed
  const filteredUsers = useMemo(() => {
    if (!queryParams.search.trim()) return users.data

    const lower = queryParams.search.toLowerCase()

    return users.data.filter((user) =>
      user.username.toLowerCase().includes(lower)
    )
  }, [users.data, queryParams.search])

  useEffect(() => {
    refetchUsers(queryParams)
  }, [queryParams, refetchUsers])

  useEffect(() => {
    refetchRoles()
  }, [refetchRoles])

  // Column
  const columns = useMemo(() => usersColumn(), []);

  return (
    <PageContainer
      icon='users'
      title='Daftar Peserta'
      subTitle='Kelola setiap peserta badiklat'
      backToTopButton
    >
      <TableViewHeader
        headerAddon={
          <p className='text-red-800 font-semibold'> {users.total} Daftar Peserta</p>
        }
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
              }
            },
          },
        }}
      />
      <TableView
        data={filteredUsers}
        columns={columns}
        loading={isLoading || authLoading}
        pageCount={users.totalPages}
        onPaginationParamsChange={(page, limit) => {
          setQueryParams((prev) => ({ ...prev, page, limit }))
        }}
      />
    </PageContainer>
  )
}