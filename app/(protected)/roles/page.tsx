'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Shield, Settings } from 'lucide-react'
import {
  fetchRoles,
  createRole,
  deleteRole,
  fetchPermissions,
  addRolePermission,
  removeRolePermission,
  type Role,
  type Permission,
} from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function RolesPage() {
  const { hasPermission, loading, user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Create Role State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })

  // Manage Permissions State
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)

  const canRead = hasPermission('role:read')
  const canCreate = hasPermission('role:create')
  const canUpdate = hasPermission('role:update')
  const canDelete = hasPermission('role:delete')

  useEffect(() => {
    if (canRead) {
      loadRoles()
      loadPermissions()
    }
  }, [canRead])

  const loadRoles = async () => {
    const data = await fetchRoles()
    setRoles(data || [])
  }

  const loadPermissions = async () => {
    const data = await fetchPermissions()
    setPermissions(data || [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRole(createForm)
    setIsCreateOpen(false)
    setCreateForm({ name: '', description: '' })
    loadRoles()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this role? This cannot be undone.')) {
      await deleteRole(id)
      loadRoles()
    }
  }

  const togglePermission = async (permId: number, checked: boolean) => {
    if (!selectedRole) return

    // Optimistic update
    const currentPerms = selectedRole.permissions || []
    let newPerms: Permission[]

    if (checked) {
      const p = permissions.find((x) => x.id === permId)
      if (!p) return
      newPerms = [...currentPerms, p]
      await addRolePermission(selectedRole.id, permId)
    } else {
      newPerms = currentPerms.filter((p) => p.id !== permId)
      await removeRolePermission(selectedRole.id, permId)
    }

    setSelectedRole({ ...selectedRole, permissions: newPerms })
    setRoles(roles.map((r) => (r.id === selectedRole.id ? { ...r, permissions: newPerms } : r)))
  }

  const openManage = (role: Role) => {
    setSelectedRole(role)
    setIsManageOpen(true)
  }

  // Helper to group permissions
  const getGroupedPermissions = () => {
    const groups: Record<string, Permission[]> = {
      'Room Management': [],
      'User Management': [],
      'Role Management': [],
      Recording: [],
      Other: [],
    }

    permissions.forEach((p) => {
      if (p.key.startsWith('room:')) groups['Room Management'].push(p)
      else if (p.key.startsWith('user:')) groups['User Management'].push(p)
      else if (p.key.startsWith('role:')) groups['Role Management'].push(p)
      else if (p.key.startsWith('recording:')) groups.Recording.push(p)
      else groups.Other.push(p)
    })

    return groups
  }

  if (loading)
    return <div className='text-muted-foreground p-8 text-center'>Loading permissions...</div>
  if (!canRead) return <div className='text-muted-foreground p-8 text-center'>Unauthorized</div>

  const groupedPermissions = getGroupedPermissions()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Roles & Permissions</h2>
          <p className='text-muted-foreground text-sm'>
            Manage user roles and their access levels.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateOpen(true)} size='sm' className='h-9 gap-2'>
            <Plus className='h-4 w-4' /> New Role
          </Button>
        )}
      </div>

      {/* Roles Table */}
      <div className='border-border bg-card overflow-hidden rounded-xl border shadow-sm'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-left text-sm'>
            <thead className='[&_tr]:border-b'>
              <tr className='hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'>
                <th className='text-muted-foreground h-12 w-[200px] px-4 align-middle font-medium'>
                  Role Name
                </th>
                <th className='text-muted-foreground h-12 px-4 align-middle font-medium'>
                  Description
                </th>
                <th className='text-muted-foreground h-12 w-[100px] px-4 text-center align-middle font-medium'>
                  Permissions
                </th>
                <th className='text-muted-foreground h-12 w-[150px] px-4 text-right align-middle font-medium'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              {roles.map((role) => (
                <tr key={role.id} className='hover:bg-muted/50 border-b transition-colors'>
                  <td className='p-4 align-middle font-medium'>{role.name}</td>
                  <td className='text-muted-foreground p-4 align-middle'>
                    {role.description || '-'}
                  </td>
                  <td className='p-4 text-center align-middle'>
                    <span className='bg-primary/10 text-primary inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium'>
                      {role.permissions?.length || 0}
                    </span>
                  </td>
                  <td className='p-4 text-right align-middle'>
                    <div className='flex justify-end gap-2'>
                      {canUpdate && (
                        <Button
                          variant='secondary'
                          size='sm'
                          className='h-8 text-xs'
                          onClick={() => openManage(role)}
                        >
                          <Settings className='mr-1.5 h-3.5 w-3.5' /> Manage
                        </Button>
                      )}
                      {role.name !== 'admin' && role.name !== 'user' && canDelete && (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-muted-foreground hover:text-destructive h-8 w-8 p-0'
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateOpen && (
        <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200'>
          <div className='bg-card border-border w-full max-w-sm space-y-4 rounded-xl border p-6 shadow-2xl'>
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Create Role</h3>
              <p className='text-muted-foreground text-xs'>Enter details for the new role.</p>
            </div>
            <form onSubmit={handleCreate} className='space-y-4'>
              <div className='space-y-3'>
                <Label>Name</Label>
                <Input
                  placeholder='e.g. Moderator'
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
                <Label>Description</Label>
                <Input
                  placeholder='Description of the role'
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div className='flex justify-end gap-2 pt-2'>
                <Button type='button' variant='ghost' onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Create Role</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {isManageOpen && selectedRole && (
        <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200'>
          <div className='bg-card border-border flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border shadow-2xl'>
            <div className='border-border bg-muted/20 flex items-center justify-between border-b p-6'>
              <div>
                <h3 className='flex items-center gap-2 text-lg font-semibold'>
                  <Shield className='text-primary h-5 w-5' />
                  Manage Permissions
                </h3>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Editing permissions for role:{' '}
                  <span className='text-foreground font-medium'>{selectedRole.name}</span>
                </p>
              </div>
              <Button variant='ghost' size='sm' onClick={() => setIsManageOpen(false)}>
                Close
              </Button>
            </div>

            <div className='bg-muted/5 flex-1 overflow-y-auto p-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {Object.entries(groupedPermissions).map(
                  ([category, perms]) =>
                    perms.length > 0 && (
                      <div key={category} className='space-y-3'>
                        <h4 className='text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wider uppercase'>
                          {category}
                          <span className='bg-muted-foreground/10 rounded-full px-1.5 py-0.5 text-[10px]'>
                            {perms.length}
                          </span>
                        </h4>
                        <div className='bg-card border-border grid gap-2 rounded-lg border p-1'>
                          {perms.map((perm) => {
                            const isAssigned = selectedRole.permissions?.some(
                              (p) => p.id === perm.id
                            )
                            return (
                              <div
                                key={perm.id}
                                className='hover:bg-muted/50 flex items-start space-x-3 rounded-md p-3 transition-colors'
                              >
                                <Checkbox
                                  id={`perm-${perm.id}`}
                                  checked={isAssigned}
                                  onCheckedChange={(checked) =>
                                    togglePermission(perm.id, checked === true)
                                  }
                                  disabled={!canUpdate}
                                  className='mt-0.5'
                                />
                                <div className='grid gap-1 leading-none'>
                                  <Label
                                    htmlFor={`perm-${perm.id}`}
                                    className='cursor-pointer text-sm leading-none font-medium'
                                  >
                                    {perm.key}
                                  </Label>
                                  <p className='text-muted-foreground line-clamp-1 text-xs'>
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>

            <div className='border-border bg-muted/20 text-muted-foreground border-t p-4 text-center text-xs'>
              Changes are saved automatically.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
