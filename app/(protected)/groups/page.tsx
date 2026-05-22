'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  fetchGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  fetchUsers,
} from '@/lib/api/admin-api'
import type { Group, UserResponse } from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { groupsColumn } from '@/column/groups'
import { CreateDialog } from '@/app/(protected)/groups/_partials/create'
import EditDialog from '@/app/(protected)/groups/_partials/edit'
import { toast } from 'sonner'

export default function GroupsPage() {
  const { isAdmin, loading } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserResponse>({ data: [] })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)

  const displayedError = (error: unknown, titleError: string) => {
    const message = error instanceof Error ? error.message : String(error)
    const displayedMessage = message
      ? message
      : 'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman'
    toast.error(titleError, {
      description: displayedMessage,
    })
  }

  const loadData = async () => {
    const [g, u] = await Promise.all([fetchGroups(), fetchUsers()])
    setGroups(
      g.map((items) => ({
        id: items.id,
        name: items.name || '-',
        description: items.description || '-',
        members: items.members,
        created_at: items.created_at,
        is_editable: items.is_editable,
      })) || []
    )
    setUsers(u || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (value: Pick<Group, 'name' | 'description'>) => {
    try {
      await createGroup(value)
      setIsCreateOpen(false)
      loadData()
      toast.success('Kelompok berhasil dibuat', {
        description: `Kelompok "${value.name}" berhasil dibuat`,
      })
    } catch (error) {
      displayedError(error, 'Gagal membuat kelompok')
    }
  }

  const handleDelete = async ({ id, name }: { id: number; name: string }) => {
    try {
      await deleteGroup(id)
      loadData()
      toast.success('Kelompok berhasil dihapus', {
        description: `Kelompok "${name}" berhasil dihapus`,
      })
    } catch (error) {
      displayedError(error, 'Gagal menghapus kelompok')
    }
  }

  const openManage = (g: Group) => {
    setSelectedGroup(g)
    setIsManageOpen(true)
    // setSelectedUserId('')
  }

  const handleAddMember = async (userId: number[]) => {
    try {
      if (!selectedGroup) return
      await addGroupMember(selectedGroup.id, userId)
      setIsManageOpen(false)
      toast.success('Kelompok berhasil diperbarui', {
        description: `Kelompok "${selectedGroup.name}" berhasil diperbarui`,
      })
      loadData()
    } catch (error) {
      displayedError(error, 'Gagal memperbarui kelompok')
    }
  }

  const handleRemoveMember = async (userId: number[]) => {
    try {
      if (!selectedGroup) return
      await removeGroupMember(selectedGroup?.id, userId)
      setIsManageOpen(false)
      toast.success('Kelompok berhasil diperbarui', {
        description: `Kelompok "${selectedGroup.name}" berhasil diperbarui`,
      })
      loadData()
    } catch (error) {
      displayedError(error, 'Gagal memperbarui kelompok')
    }
  }

  // Filter users not in the group
  const availableUsers = users?.data.filter(
    (u) => !selectedGroup?.members?.some((m) => m.id === u.id)
  )

  if (loading) return <div className='text-muted-foreground p-8 text-center'>Loading...</div>

  return (
    <PageContainer
      icon='groups'
      title='Daftar Kelompok'
      subTitle='Kelola anggota Anda dalam tiap kelompok'
    >
      {groups.length === 0 ? (
        <div className='bg-card border-border text-muted-foreground overflow-hidden rounded-lg border p-8 text-center text-sm shadow-sm'>
          Tidak ada kelompok
        </div>
      ) : (
        <TableView
          data={groups}
          columns={groupsColumn({ handleDelete, openManage })}
          add={{
            children: (
              <>
                <Plus /> Tambah Kelompok
              </>
            ),
            onClick: () => setIsCreateOpen(true),
            hidden: !isAdmin,
          }}
        />
      )}
      <CreateDialog {...{ isCreateOpen, setIsCreateOpen, handleCreate }} />
      <EditDialog
        {...{
          isManageOpen,
          setIsManageOpen,
          selectedGroup,
          availableUsers,
          handleAddMember,
          handleRemoveMember,
        }}
      />
    </PageContainer>
  )
}
