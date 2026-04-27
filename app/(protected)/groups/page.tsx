'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, X } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { groupsColumn } from '@/column/groups'

export default function GroupsPage() {
  const { hasPermission, loading } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserDto[]>([])

  // Create Group State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createGroup(createForm)
    setIsCreateOpen(false)
    setCreateForm({ name: '', description: '' })
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
  const availableUsers = users.filter((u) => !selectedGroup?.members?.some((m) => m.id === u.id))

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
            onClick: () => setIsCreateOpen(true),
          }}
        />
      )}

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a group to organize users.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className='space-y-4'>
            <div className='space-y-3'>
              <Label>Name</Label>
              <Input
                placeholder='e.g. Engineering'
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
              <Label>Description</Label>
              <Input
                placeholder='Group description'
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='ghost' onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Create Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Add or remove users from{' '}
              <span className='text-foreground font-semibold'>{selectedGroup?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Add Member */}
            <div className='bg-muted/30 border-border flex items-end gap-2 rounded-lg border p-4'>
              <div className='flex-1 space-y-1.5'>
                <Label className='text-xs'>Add User</Label>
                <select
                  className='border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value=''>Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAddMember} disabled={!selectedUserId} className='h-9'>
                <UserPlus className='mr-2 h-4 w-4' /> Add
              </Button>
            </div>

            {/* Member List */}
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                Current Members ({selectedGroup?.members?.length || 0})
              </Label>
              <div className='border-border divide-border/50 max-h-[300px] divide-y overflow-y-auto rounded-lg border'>
                {selectedGroup?.members?.map((member) => (
                  <div
                    key={member.id}
                    className='hover:bg-muted/50 flex items-center justify-between p-3 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium'>
                        {member.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className='text-sm font-medium'>{member.username}</span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-destructive h-8 w-8'
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {!selectedGroup?.members?.length && (
                  <div className='text-muted-foreground p-8 text-center text-sm'>
                    No members in this group.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
