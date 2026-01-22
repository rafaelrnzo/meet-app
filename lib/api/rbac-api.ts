import { API_URL, getAuthHeaders } from "./api";

export interface Permission {
    object: string;
    action: string;
}

export interface SystemPermission extends Permission {
    label: string;
}

export interface Role {
    name: string;
}

export interface RolePermissions {
    role: string;
    permissions: Permission[];
}

export async function fetchRoles(): Promise<string[]> {
    const res = await fetch(`${API_URL}/admin/roles`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch roles");
    const data = await res.json();
    return data.roles;
}

export async function createRole(role: string): Promise<void> {
    const res = await fetch(`${API_URL}/admin/roles`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create role");
    }
}

export async function fetchRolePermissions(role: string): Promise<RolePermissions> {
    const res = await fetch(`${API_URL}/admin/roles/${role}/permissions`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch permissions");
    return await res.json();
}

export async function addPermission(role: string, object: string, action: string): Promise<void> {
    const res = await fetch(`${API_URL}/admin/roles/permissions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, object, action }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add permission");
    }
}

export async function removePermission(role: string, object: string, action: string): Promise<void> {
    const res = await fetch(`${API_URL}/admin/roles/permissions`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, object, action }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove permission");
    }
}

export async function fetchSystemPermissions(): Promise<SystemPermission[]> {
    const res = await fetch(`${API_URL}/admin/system/permissions`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch system permissions");
    const data = await res.json();
    return data.permissions;
}
