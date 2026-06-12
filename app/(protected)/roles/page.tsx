'use client'

import { useEffect, useState } from 'react'
import { fetchRoles, fetchPermissions, addRolePermission } from '@/lib/api/admin-api'
import type { Role, Permission } from '@/lib/api/admin-api'
import { useAuth } from '../../../hooks/use-auth'
import PageContainer from '@/compounds/page-container'
import { TableView } from '@/compounds/table-view'
import { rolesColumn } from '@/column/roles'
import EditRoles from '@/app/(protected)/roles/_partials/edit'
import { toast } from '@/components/ui/sonner'
import { displayedError } from '@/lib/utils'
import ErrorPage from '@/compounds/error-page'

export default function RolesPage() {
  const { isAdmin } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadRoles = async () => {
    try {
      setLoading(true)
      const data = await fetchRoles()
      setRoles(data || [])
    } catch (error) {
      setRoles([])
      console.error(error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  const loadPermissions = async () => {
    try {
      const data = await fetchPermissions()
      setPermissions(data || [])
    } catch (error) {
      setPermissions([])
      console.error(error)
    }
  }

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const openManage = (role: Role) => {
    setSelectedRole(role)
    setIsManageOpen(true)
  }

  const getGroupedPermissions = () => {
    const groups: Record<string, Permission[]> = {
      'Room Management': [],
      'User Management': [],
      'Role Management': [],
      'Recording Management': [],
      'Group Management': [],
      'Meet Screen Management': [],
      Other: [],
    }

    permissions.forEach((p) => {
      if (p.key.startsWith('room:')) groups['Room Management'].push(p)
      else if (p.key.startsWith('user:')) groups['User Management'].push(p)
      else if (p.key.startsWith('role:')) groups['Role Management'].push(p)
      else if (p.key.startsWith('recording:')) groups['Recording Management'].push(p)
      else if (p.key.startsWith('group:')) groups['Group Management'].push(p)
      else if (p.key.startsWith('ui:')) groups['Meet Screen Management'].push(p)
      else groups.Other.push(p)
    })
    return groups
  }

  const handleAddPermissions = async (value: number[]) => {
    try {
      await addRolePermission(Number(selectedRole?.id), value)
      toast.success('Peran berhasil diperbarui', {
        description: `Peran "${selectedRole?.name}" berhasil diperbarui`,
      })
      setIsManageOpen(false)
      loadRoles()
    } catch (error) {
      displayedError(error, 'Gagal memperbarui peran')
    }
  }
  const groupedPermissions = getGroupedPermissions()
  if (!isAdmin) return <ErrorPage status={401} />

  return (
    <>
      <PageContainer
        icon='roles'
        title='Roles & Permissions'
        subTitle='Kelola peran & izin dari setiap peserta badiklat'
      >
        {roles.length && (
          <>
            <TableView loading={loading} data={roles} columns={rolesColumn({ openManage })} />
            <EditRoles
              {...{
                handleAddPermissions,
                selectedRole,
                isManageOpen,
                setIsManageOpen,
                groupedPermissions: {
                  room: groupedPermissions['Room Management'],
                  groups: groupedPermissions['Group Management'],
                  users: groupedPermissions['User Management'],
                  roles: groupedPermissions['Role Management'],
                  recordings: groupedPermissions['Recording Management'],
                  meet_screen: groupedPermissions['Meet Screen Management'],
                  other: groupedPermissions.Other,
                },
              }}
            />
          </>
        )}
      </PageContainer>
    </>
  )
}
