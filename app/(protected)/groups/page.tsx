'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Users, Settings, Search, UserPlus, X } from 'lucide-react'
import {
  fetchGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  fetchUsers,
  type Group as GroupDto,
  type User as UserDto,
} from '@/lib/api/admin-api'
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

export default function GroupsPage() {
  const { hasPermission, loading } = useAuth()
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [users, setUsers] = useState<UserDto[]>([])

  // Create Group State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })

  // Manage Members State
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [g, u] = await Promise.all([fetchGroups(), fetchUsers()])
    setGroups(g || [])
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
    if (confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      await deleteGroup(id)
      loadData()
    }
  }

  const openManage = (g: GroupDto) => {
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Teams & Groups</h2>
          <p className='text-muted-foreground text-sm'>
            Organize users into teams for easier management.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size='sm' className='h-9 gap-2'>
          <Plus className='h-4 w-4' /> New Group
        </Button>
      </div>

      {/* Groups Table */}
      <div className='border-border bg-card overflow-hidden rounded-xl border shadow-sm'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-left text-sm'>
            <thead className='[&_tr]:border-b'>
              <tr className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'>
                <th className='text-muted-foreground h-12 w-[200px] px-4 align-middle font-medium'>
                  Group Name
                </th>
                <th className='text-muted-foreground h-12 px-4 align-middle font-medium'>
                  Description
                </th>
                <th className='text-muted-foreground h-12 w-[100px] px-4 text-center align-middle font-medium'>
                  Members
                </th>
                <th className='text-muted-foreground h-12 w-[150px] px-4 text-right align-middle font-medium'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              {groups.map((group) => (
                <tr key={group.id} className='hover:bg-muted/50 border-b transition-colors'>
                  <td className='p-4 align-middle font-medium'>
                    <div className='flex items-center gap-2'>
                      <Users className='text-muted-foreground h-4 w-4' />
                      {group.name}
                    </div>
                  </td>
                  <td className='text-muted-foreground p-4 align-middle'>
                    {group.description || '-'}
                  </td>
                  <td className='p-4 text-center align-middle'>
                    <span className='bg-primary/10 text-primary inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium'>
                      {group.members?.length || 0}
                    </span>
                  </td>
                  <td className='p-4 text-right align-middle'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='h-8 text-xs'
                        onClick={() => openManage(group)}
                      >
                        <Settings className='mr-1.5 h-3.5 w-3.5' /> Manage
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-muted-foreground hover:text-destructive h-8 w-8 p-0'
                        onClick={() => handleDelete(group.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={4} className='text-muted-foreground p-8 text-center'>
                    No groups created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  )
}
