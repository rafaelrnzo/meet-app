"use client";

import { useState, useEffect } from "react";
import { Role, fetchRoles, createRole } from "@/lib/api/rbac-api";
import { RoleEditor } from "@/components/features/admin/RoleEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Shield } from "lucide-react";

export default function RolesPage() {
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await fetchRoles();
            setRoles(data);
        } catch (e) {
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;
        try {
            setIsCreating(true);
            await createRole(newRoleName);
            setRoles((prev) => [...prev, newRoleName]);
            setNewRoleName("");
            toast.success("Role created");
        } catch (e: any) {
            toast.error(e.message || "Failed to create role");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6" /> Role Management
                </h1>
                <p className="text-muted-foreground">Manage roles and their permissions in the system.</p>
            </div>

            {/* Create Role */}
            <div className="flex gap-2 items-end max-w-md">
                <div className="grid w-full items-center gap-1.5">
                    <Input
                        placeholder="New Role Name (e.g. Moderator)"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                    />
                </div>
                <Button onClick={handleCreateRole} disabled={isCreating || !newRoleName}>
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Role List */}
                <div className="md:col-span-4 bg-card border rounded-lg overflow-hidden h-fit">
                    <div className="p-4 border-b font-medium bg-muted/50">Roles</div>
                    {loading ? (
                        <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="flex flex-col">
                            {roles.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setSelectedRole(r)}
                                    className={`text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 ${selectedRole === r ? "bg-primary/10 text-primary font-medium" : ""}`}
                                >
                                    {r}
                                </button>
                            ))}
                            {roles.length === 0 && <div className="p-4 text-muted-foreground text-sm">No roles found.</div>}
                        </div>
                    )}
                </div>

                {/* Editor */}
                <div className="md:col-span-8">
                    {selectedRole ? (
                        <RoleEditor role={selectedRole} />
                    ) : (
                        <div className="bg-muted/20 border-dashed border-2 rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground">
                            <Shield className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a role to manage permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
