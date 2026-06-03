import { Button } from '@/components/ui/button'
import { Trash2, } from 'lucide-react'
import type {
    Role,
    User
} from '@/lib/api/admin-api';
import {

    updateUserRole,
    deleteUser

} from '@/lib/api/admin-api'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface UserProps {
    filteredUsers: User[]
    permissions: {
        canCreate: boolean
        canUpdate: boolean
        canDelete: boolean
    }
    roles: Role[]
    loadData: () => void
}

const getRoleBadgeVariant = (roleName: string) => {
    const lower = roleName.toLowerCase()
    if (lower === 'admin' || lower === 'administrator') return 'destructive'
    if (lower === 'manager' || lower === 'moderator') return 'default'
    return 'secondary'
}


function UserTable({ filteredUsers, permissions, roles, loadData }: UserProps) {
    const { canUpdate, canDelete } = permissions

    const getRoleName = (user: User) => {
        if (user.role) return user.role.name
        const r = roles.find((r) => r.id === user.role_id)
        return r ? r.name : 'Unknown'
    }


    return (<Table>
        <TableHeader className='bg-muted/50'>
            <TableRow>
                <TableHead className='w-[300px]'>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className='text-right'>Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {filteredUsers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className='h-24 text-center'>
                        No users found.
                    </TableCell>
                </TableRow>
            ) : (
                filteredUsers.map((u) => (
                    <TableRow key={u.id} className='group'>
                        <TableCell className='font-medium'>
                            <div className='flex items-center gap-3'>
                                <div className='bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold'>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className='text-sm font-medium'>{u.username}</p>
                                    <p className='text-muted-foreground text-xs'>ID: {u.id}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className='flex items-center gap-2'>
                                {canUpdate ? (
                                    <div className='w-[180px]'>
                                        <Select
                                            value={(u.role_id || u.role?.id)?.toString()}
                                            onValueChange={async (val) => {
                                                try {
                                                    await updateUserRole(u.id, Number(val))
                                                    loadData()
                                                } catch (e) {
                                                    console.error(e)
                                                }
                                            }}
                                            disabled={!canUpdate}
                                        >
                                            <SelectTrigger className='h-8 text-xs'>
                                                <div className='flex items-center gap-2'>
                                                    <Badge
                                                        variant={getRoleBadgeVariant(getRoleName(u))}
                                                        className='pointer-events-none h-5 px-1.5 py-0 text-[10px] uppercase'
                                                    >
                                                        {getRoleName(u)}
                                                    </Badge>
                                                    {/* Helper text for context in dropdown, hidden in trigger if redundant */}
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>
                                                        <div className='flex items-center gap-2'>
                                                            <Badge
                                                                variant={getRoleBadgeVariant(r.name)}
                                                                className='origin-left scale-75'
                                                            >
                                                                {r.name}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <Badge variant={getRoleBadgeVariant(getRoleName(u))}>
                                        {getRoleName(u)}
                                    </Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className='text-right'>
                            {canDelete && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={async () => {
                                        if (confirm(`Are you sure you want to delete ${u.username}?`)) {
                                            await deleteUser(u.id)
                                            loadData()
                                        }
                                    }}
                                    className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100'
                                >
                                    <Trash2 className='h-4 w-4' />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
    )
}

export default UserTable