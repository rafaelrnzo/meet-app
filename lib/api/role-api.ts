import { apiRequest } from '@/lib/api/admin-api'

export type Role = {
  id: number
  name: string
  description: string
  permissions: Permission[]
  created_at: string
  updated_at: string
}

export type Permission = {
  id: number
  key: string
  description: string
}

export async function fetchRoles(): Promise<Role[]> {
  return apiRequest('/admin/roles')
}

export async function createRole(name: string, description: string): Promise<Role> {
  return apiRequest('/admin/roles', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function updateRole(id: number, name: string, description: string): Promise<Role> {
  return apiRequest(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  })
}

export async function deleteRole(id: number): Promise<void> {
  await apiRequest(`/admin/roles/${id}`, { method: 'DELETE' })
}

export async function fetchPermissions(): Promise<Permission[]> {
  return apiRequest('/admin/roles/permissions')
}

export async function addPermissionToRole(roleId: number, permissionId: number): Promise<void> {
  await apiRequest(`/admin/roles/${roleId}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permission_id: permissionId }),
  })
}

export async function removePermissionFromRole(
  roleId: number,
  permissionId: number
): Promise<void> {
  await apiRequest(`/admin/roles/${roleId}/permissions/${permissionId}`, {
    method: 'DELETE',
  })
}

export async function initDefaultRoles(): Promise<void> {
  await apiRequest('/admin/roles/init-defaults', { method: 'POST' })
}
