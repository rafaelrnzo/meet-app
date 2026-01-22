"use client";

import { useState, useEffect } from "react";
import { Permission, fetchRolePermissions, addPermission, removePermission, fetchSystemPermissions, SystemPermission } from "@/lib/api/rbac-api";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoleEditorProps {
    role: string;
}

export function RoleEditor({ role }: RoleEditorProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [systemPermissions, setSystemPermissions] = useState<SystemPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, [role]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [roleData, sysData] = await Promise.all([
                fetchRolePermissions(role),
                fetchSystemPermissions()
            ]);
            setPermissions(roleData.permissions || []);
            setSystemPermissions(sysData || []); // Use fetched system permissions
        } catch (e) {
            console.error(e);
            toast.error("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = async (p: { object: string; action: string }, checked: boolean) => {
        try {
            setUpdating(true);
            if (checked) {
                await addPermission(role, p.object, p.action);
                setPermissions((prev) => [...prev, { object: p.object, action: p.action }]);
                toast.success("Permission added");
            } else {
                await removePermission(role, p.object, p.action);
                setPermissions((prev) =>
                    prev.filter((existing) => !(existing.object === p.object && existing.action === p.action))
                );
                toast.success("Permission removed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to update permission");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card">
            <h3 className="text-lg font-medium">Permissions for {role}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {systemPermissions.map((sysPerm) => {
                    const isChecked = permissions.some(
                        (p) => p.object === sysPerm.object && p.action === sysPerm.action
                    );

                    return (
                        <div key={`${sysPerm.object}:${sysPerm.action}`} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${sysPerm.object}:${sysPerm.action}`}
                                checked={isChecked}
                                onCheckedChange={(checked: boolean) => togglePermission(sysPerm, checked === true)}
                                disabled={updating}
                            />
                            <label
                                htmlFor={`${sysPerm.object}:${sysPerm.action}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {sysPerm.label}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
