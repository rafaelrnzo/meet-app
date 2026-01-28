import { getToken } from "./auth-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

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

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = getToken()
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    }

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${res.status}`)
    }
    return res.json()
}

export async function fetchRoles(): Promise<Role[]> {
    return fetchWithAuth("/admin/roles")
}

export async function createRole(name: string, description: string): Promise<Role> {
    return fetchWithAuth("/admin/roles", {
        method: "POST",
        body: JSON.stringify({ name, description }),
    })
}

export async function updateRole(id: number, name: string, description: string): Promise<Role> {
    return fetchWithAuth(`/admin/roles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
    })
}

export async function deleteRole(id: number): Promise<void> {
    await fetchWithAuth(`/admin/roles/${id}`, { method: "DELETE" })
}

export async function fetchPermissions(): Promise<Permission[]> {
    return fetchWithAuth("/admin/roles/permissions")
}

export async function addPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    await fetchWithAuth(`/admin/roles/${roleId}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permission_id: permissionId }),
    })
}

export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await fetchWithAuth(`/admin/roles/${roleId}/permissions/${permissionId}`, {
        method: "DELETE",
    })
}

export async function initDefaultRoles(): Promise<void> {
    await fetchWithAuth("/admin/roles/init-defaults", { method: "POST" })
}
