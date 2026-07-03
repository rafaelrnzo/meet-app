'use client'

import type { Role, Permission } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { displayedError } from '@/lib/utils'
import { fetchRoles, fetchPermissions, addRolePermission } from '@/lib/api/admin-api'
import { TableView } from '@/compounds/table-view'
import { default as PageContainer } from '@/compounds/page-container'
import { toast } from '@/components/ui/sonner'
import { rolesColumn } from '@/column/roles'
import { default as EditRoles } from '@/app/(protected)/roles/_partials/edit'
import { useAuth } from '../../../hooks/use-auth'

enum RolesEventSSE {
  RolesUpdated = 'role_update',
}

export default function RolesPage() {
  const { token } = useAuth({ requireAdmin: true })
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
      setLoading(false)
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

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/roles/events?token=${token}`
    )
    es.onmessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data)
      if ([RolesEventSSE.RolesUpdated].includes(payload.type)) {
        loadRoles()
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
