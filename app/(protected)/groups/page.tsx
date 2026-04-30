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
import type { Group, User as UserDto } from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { groupsColumn } from '@/column/groups'
import { CreateDialog } from '@/app/(protected)/groups/_partials/create'
import EditDialog from '@/app/(protected)/groups/_partials/edit'

export default function GroupsPage() {
  const { hasPermission, loading } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserDto>({ data: [] })

  // Create Group State
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Manage Members State
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [g, u] = await Promise.all([fetchGroups(), fetchUsers()])
    setGroups(
      g.map((items) => ({
        id: items.id,
        name: items.name || '-',
        description: items.description || '-',
        members: items.members,
        created_at: items.created_at,
      })) || []
    )
    setUsers(u || [])
  }

  const handleCreate = async (value: Pick<Group, 'name' | 'description'>) => {
    await createGroup(value)
    setIsCreateOpen(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    await deleteGroup(id)
    loadData()
  }

  const openManage = (g: Group) => {
    setSelectedGroup(g)
    setIsManageOpen(true)
    setSelectedUserId('')
  }

  const handleAddMember = async () => {
    if (!selectedGroup || !selectedUserId) return
    await addGroupMember(selectedGroup.id, Number(selectedUserId))

    // Refresh data
    const updatedGroups = await fetchGroups()
    setGroups(updatedGroups || [])

    // Update selected group reference
    const updatedSelected = updatedGroups?.find((g) => g.id === selectedGroup.id)
    if (updatedSelected) setSelectedGroup(updatedSelected)

    setSelectedUserId('')
  }

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return
    await removeGroupMember(selectedGroup.id, userId)

    // Refresh data
    const updatedGroups = await fetchGroups()
    setGroups(updatedGroups || [])

    // Update selected group reference
    const updatedSelected = updatedGroups?.find((g) => g.id === selectedGroup.id)
    if (updatedSelected) setSelectedGroup(updatedSelected)
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
          No groups are created
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
          }}
        />
      )}
      <CreateDialog {...{ isCreateOpen, setIsCreateOpen, handleCreate }} />
      <EditDialog
        {...{
          isManageOpen,
          setIsManageOpen,
          selectedGroup,
          selectedUserId,
          setSelectedUserId,
          availableUsers,
          handleAddMember,
          handleRemoveMember,
        }}
      />
    </PageContainer>
  )
}
