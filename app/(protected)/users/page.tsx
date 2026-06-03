'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { usersColumn } from '@/column/users'
import { TableViewHeader } from '@/compounds/table-view/header'
import type { SelectOption } from '@/components/features/users/UserSelect';
import { useUserManagement } from '@/feat/users/useUserManagement'
import type { RoomStatus } from '@/feat/users/dto'
import { Modal } from '@/components/ui/modal'
import { updateUserRole } from '@/lib/api/admin-api'
import { toast } from '@/components/ui/sonner'

export default function UsersPage() {
  // State
  const [searchQuery, setSearchQuery] = useState('')

  // Hooks
  const { roles, users, setUsers, setRoles, refetchUsers, refetchRoles } = useUserManagement()
  const [queryParams, setQueryParams] = useState<{ status: RoomStatus }>({ status: 'all' })
  const [openModal, setOpenModal] = useState<{ userId: number | null, isOpen: boolean }>({ userId: null, isOpen: false })

  // Permissions
  // TODO: Implement permissions for create, update, delete actions
  // const { hasPermission } = useAuth({ requirePermission: 'user:read' })
  // const canCreate = hasPermission('user:create')
  // const canUpdate = hasPermission('user:update')
  // const canDelete = hasPermission('user:delete')

  // Handler & Computed
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const lower = searchQuery.toLowerCase();
    return users.filter((user) =>
      user.username.toLowerCase().includes(lower)
    );
  }, [users, searchQuery]);

  useEffect(() => {
    refetchUsers()
    refetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRole = useCallback(async (userId: number, selectedRole: SelectOption | null) => {
    const roleId = selectedRole ? selectedRole.value : 0
    try {
      const response = await updateUserRole(userId, roleId) // NOTE: Pastikan endpoint API untuk update role 
      console.log(response)
      toast.success('Peran pengguna berhasil diperbarui')
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message ?? 'Gagal memperbarui peran pengguna')
        setRoles((prev) => prev.map((role) => role))
      }
    }
  }, [setRoles])

  const handleManage = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    setUsers((prevUsers) => {
      return prevUsers.map((user) => {
        if (user.id === openModal.userId) {
          return {
            ...user,
            status: user.status === 'active' ? 'inactive' : 'active',
          }
        }
        return user
      })
    }
    )
    setOpenModal(({ userId: null, isOpen: false }))
  }

  // Column
  const columns = useMemo(() => usersColumn({ roles, handleRole, setOpenModal }), [roles, handleRole]);

  return (
    <PageContainer
      icon='users'
      title='Daftar Peserta'
      subTitle='Kelola setiap peserta badiklat'
      backToTopButton
    >
      <TableViewHeader
        search={{
          placeholder: 'Cari peserta ...',
          onSearch: (search) => setSearchQuery(search),
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
              value: queryParams.status,
              onValueChange: (status: RoomStatus) => {
                const updatedParams = { ...queryParams, status: status }
                setQueryParams(updatedParams)
                refetchUsers(updatedParams)
              },
            },
          },
        }}
      />
      <TableView
        data={filteredUsers}
        columns={columns}
      />

      <Modal
        root={{ open: openModal.isOpen, onOpenChange: (open) => setOpenModal((prev) => ({ ...prev, isOpen: open })), modal: false }}
        title={{
          children: 'Non-aktifkan pengguna',
        }}
        description={{
          children: '',
        }}
        submit={{
          children: 'Nonaktifkan Pengguna',
          onClick: handleManage,
          disabled: false,
        }}
        cancel={{
          children: 'Batal',
        }}
      >
        Tindakan ini akan menonaktifkan dan memaksa peserta agar keluar dari ruang rapat dan dashboard sementara waktu sampai Anda aktifkan kembali. Anda dapat kembali mengaktifkannya kembali dengan cara yang sama.
      </Modal>
    </PageContainer>
  )
}