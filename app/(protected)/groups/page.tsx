'use client'

import type { Group, UserResponse } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { displayedError } from '@/lib/utils'
import {
  fetchGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  fetchUsers,
} from '@/lib/api/admin-api'
import { TableView } from '@/compounds/table-view'
import { default as PageContainer } from '@/compounds/page-container'
import { toast } from '@/components/ui/sonner'
import { default as NoData } from '@/components/ui/no-data'
import { Icon } from '@/components/ui/icon'
import { groupsColumn } from '@/column/groups'
import { default as EditDialog } from '@/app/(protected)/groups/_partials/edit'
import { CreateDialog } from '@/app/(protected)/groups/_partials/create'
import { useAuth } from '../../../hooks/use-auth'

enum GroupsEventSSE {
  GroupUpdated = 'group_updated',
  GroupDeleted = 'group_deleted',
}

export default function GroupsPage() {
  const { hasPermission, token } = useAuth({ requirePermission: 'group:read' })
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserResponse>({ data: [] })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const canManage = hasPermission('group:manage')

  const loadData = async () => {
    try {
      setLoading(true)
      const [g, u] = await Promise.all([
        fetchGroups(),
        fetchUsers({
          params: {
            limit: 99999,
          },
        }),
      ])
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
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/groups/events?token=${token}`
    )
    es.onmessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data)
      if ([GroupsEventSSE.GroupUpdated, GroupsEventSSE.GroupDeleted].includes(payload.type)) {
        loadData()
      }
    }
    es.onerror = () => {
      console.error('Error connecting to SSE server.')
      es.close()
    }
    return () => {
      es.close()
    }
  }, [token])

  const handleCreate = async (value: Pick<Group, 'name' | 'description'>) => {
    try {
      await createGroup(value)
      setIsCreateOpen(false)
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
  }

  const handleUpdate = async (unstoreIds: number[], displayedParticipants: number[]) => {
    try {
      if (!selectedGroup) return
      await Promise.all([
        unstoreIds.length
          ? await removeGroupMember(selectedGroup?.id, unstoreIds)
          : Promise.resolve(),
        displayedParticipants.length
          ? addGroupMember(selectedGroup.id, displayedParticipants)
          : Promise.resolve(),
      ])
      setIsManageOpen(false)
      toast.success('Kelompok berhasil diperbarui', {
        description: `Kelompok "${selectedGroup.name}" berhasil diperbarui`,
      })
    } catch (error) {
      displayedError(error, 'Gagal memperbarui kelompok')
    }
  }

  // Filter users not in the group
  const availableUsers = users?.data.filter(
    (u) => !selectedGroup?.members?.some((m) => m.id === u.id)
  )

  return (
    <div>
      {!loading && groups.length === 0 ? (
        <NoData
          title='Tidak Ada kelompok yang Tersedia'
          {...(canManage && {
            desc: 'Silakan buat kelompok baru',
            insertButton: {
              children: (
                <>
                  <Icon type='plus' /> Buat Kelompok Baru
                </>
              ),
              onClick: () => setIsCreateOpen(true),
            },
          })}
          className='min-h-[calc(100vh-208px)]'
        />
      ) : (
        <PageContainer
          icon='groups'
          title='Daftar Kelompok'
          subTitle='Kelola anggota Anda dalam tiap kelompok'
        >
          <TableView
            loading={loading}
            data={groups}
            columns={groupsColumn({ handleDelete, openManage })}
            add={{
              children: (
                <>
                  <Icon type='plus' /> Tambah Kelompok
                </>
              ),
              onClick: () => setIsCreateOpen(true),
              hidden: !canManage,
            }}
            state={{
              columnVisibility: {
                action: canManage,
              },
            }}
          />
        </PageContainer>
      )}
      <CreateDialog {...{ isCreateOpen, setIsCreateOpen, handleCreate }} />
      <EditDialog
        {...{
          isManageOpen,
          setIsManageOpen,
          selectedGroup,
          availableUsers,
          handleUpdate,
        }}
      />
    </div>
  )
}
