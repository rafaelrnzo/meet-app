'use client'

import type { UserParams, UserPrensence } from '@/feat/users/dto'
import { useEffect, useMemo, useState } from 'react'
import { useRealTimeUsers } from '@/hooks/use-real-time-users'
import { useAuth } from '@/hooks/use-auth'
import { useParticipants } from '@/feat/users/useParticipants'
import { TableViewHeader } from '@/compounds/table-view/header'
import { TableView } from '@/compounds/table-view'
import { default as PageContainer } from '@/compounds/page-container'
import { toast } from '@/components/ui/sonner'
import { usersColumn } from '@/column/users'

export default function UsersPage() {
  // State
  const [queryParams, setQueryParams] = useState({
    page: 1,
    search: '',
    presence: 'all' as UserParams['presence'],
  })

  const { loading: authLoading } = useAuth({ requirePermission: 'user:read' })

  // Hooks
  const { users, isLoading, refetchUsers, refetchRoles, setUsers } = useParticipants()

  useRealTimeUsers((event) => {
    if (event.type === 'user_updated') {
      setUsers((prev) => ({
        ...prev,
        data: prev.data.map((user) => {
          if (user.id !== event.data?.id) return user
          return {
            ...user,
            presence: event.data.presence,
          }
        }),
      }))
    }
  })

  // Handler & Computed
  const filteredUsers = useMemo(() => {
    if (!queryParams.search.trim()) return users.data

    const lower = queryParams.search.toLowerCase()

    return users.data.filter((user) => user.username.toLowerCase().includes(lower))
  }, [users.data, queryParams.search])

  useEffect(() => {
    if (!users.data.length && queryParams.search) {
      toast.error(`${queryParams.search} tidak ditemukan`)
    }
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
    <PageContainer icon='users' title='Daftar Peserta' subTitle='Kelola setiap peserta badiklat'>
      <TableViewHeader
        headerAddon={<p className='font-semibold text-red-800'> {users.total} Daftar Peserta</p>}
        search={{
          placeholder: 'Cari peserta ...',
          onSearch: (search) => setQueryParams((prev) => ({ ...prev, page: 1, search })),
          'aria-invalid': !users.data.length,
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
