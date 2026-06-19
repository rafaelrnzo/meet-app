'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { User } from '@/lib/api/admin-api';
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { UserPrensence } from '@/feat/users/dto';
import { Tooltip as TooltipBase, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export const Tooltip = ({ trigger, content }: { trigger: React.ReactNode, content: React.ReactNode }) => {
    return (
        <TooltipBase>
            <TooltipTrigger className='cursor-pointer '>
                {trigger}
            </TooltipTrigger>
            <TooltipContent className='bg-red-800'>
                {content}
            </TooltipContent>
        </TooltipBase>
    )

}

export const usersColumn = (): ColumnDef<User>[] => {
    return [
        {
            accessorKey: 'username',
            header: 'Peserta',
            minSize: 325,
            maxSize: 325,
            cell: ({ row }) => {
                const username = row.original.username || '-'
                const email = row.original.email || '-'
                const nameAvatar = username !== '-' ? username.substring(0, 2).toUpperCase() : '??'

                const isUsernameLong = username.length > 25
                const displayUsername = isUsernameLong ? `${username.substring(0, 25)}...` : username

                const isEmailLong = email.length > 25
                const displayEmail = isEmailLong ? `${email.substring(0, 25)}...` : email

                return (
                    <div className='flex flex-row items-center gap-2.5 min-w-0'>
                        <Avatar size='lg'>
                            <AvatarFallback>{nameAvatar}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col min-w-0'>

                            {isUsernameLong ? (
                                <Tooltip
                                    trigger={
                                        <p className='font-semibold truncate max-w-[200px] text-left'>
                                            {displayUsername}
                                        </p>
                                    }
                                    content={
                                        <p className='font-semibold text-white'>
                                            {username}
                                        </p>
                                    }
                                />
                            ) : (
                                <p className='font-semibold truncate max-w-[200px]'>
                                    {username}
                                </p>
                            )}

                            {isEmailLong ? (
                                <Tooltip
                                    trigger={
                                        <p className='text-neutral-400 text-xs truncate max-w-[200px] text-left'>
                                            {displayEmail}
                                        </p>
                                    }
                                    content={
                                        <p className='text-xs text-white'>
                                            {email}
                                        </p>
                                    }
                                />
                            ) : (
                                <p className='text-neutral-400 text-xs truncate max-w-[200px]'>
                                    {email}
                                </p>
                            )}

                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: 'role.name',
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
            enableSorting: false,
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

