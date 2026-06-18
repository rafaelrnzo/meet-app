'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User } from '@/lib/api/admin-api';
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { UserPrensence } from '@/feat/users/dto';

export const usersColumn = (): ColumnDef<User>[] => {
    return [
        {
            accessorKey: 'username',
            header: 'Peserta',
            minSize: 325,
            maxSize: 325,
            cell: ({ row }) => {
                const username = row.original.username.replace(/\b[a-z]/g, (match) => match.toUpperCase());

                return (
                    <div className='flex flex-row items-center gap-2.5'>
                        <Avatar size='lg'>
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className='font-semibold'>
                                {username}
                            </p>
                            {/* Tips: Ganti hardcode ini dengan email asli dari data jika ada, misal: row.original.email */}
                            <p className='text-neutral-400'>{row.original.email ?? '-'}</p>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'role',
            header: 'Peran',
            minSize: 200,
            maxSize: 200,
            cell: ({ row }) => {
                const role = (row.original.role?.name as keyof typeof roles) ?? 'user';
                const roles = {
                    'admin': 'Admin',
                    'user': 'Peserta',
                    'moderator': 'Moderator'
                }

                return (
                    <Badge variant='outline' className='bg-red-50 capitalize border-red-800 text-red-800 text-sm px-3 py-2 rounded not-italic'> {roles[role] ?? role} </Badge>

                )
            }
        },
        {
            accessorKey: 'presence',
            header: 'Status di ruangan rapat',
            minSize: 345,
            maxSize: 345,
            cell: ({ row }) => {
                const presence = row.original.presence || [];
                const getBadgeConfig = (statusStr: string) => {
                    const lowerStr = statusStr.toLowerCase();

                    if (lowerStr.includes(UserPrensence.WAITING)) {
                        const cleanLabel = statusStr.replace(/waiting to join/i, 'Menunggu Persetujuan');
                        return {
                            id: UserPrensence.WAITING,
                            label: cleanLabel,
                            variant: 'outline' as const,
                        };
                    }

                    if (lowerStr.includes(UserPrensence.BANNED)) {
                        const cleanLabel = statusStr.replace(/banned/i, 'Diblokir');
                        return {
                            id: UserPrensence.BANNED,
                            label: cleanLabel,
                            variant: 'destructive' as const,
                        };
                    }

                    return {
                        id: UserPrensence.IDLE,
                        label: statusStr,
                        variant: 'secondary' as const,
                    };
                };

                return (
                    <div className="flex flex-wrap gap-2">
                        {presence.map((status, index) => {
                            const config = getBadgeConfig(status);
                            const isIdle = config.id === UserPrensence.IDLE;
                            return (
                                isIdle ? '-' :
                                    <Badge key={index} variant={config.variant}>
                                        {config.label}
                                    </Badge>
                            );
                        })}
                    </div>
                );
            }
        }
    ]
}

