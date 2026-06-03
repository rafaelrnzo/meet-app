'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Role, User } from '@/lib/api/admin-api'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { Check, Info, X, } from 'lucide-react'

import type { SelectOption } from '@/components/features/users/UserSelect';
import { UserSelect } from '@/components/features/users/UserSelect'
import { Badge } from '@/components/ui/badge'


interface UserColumnProps {
    roles: Role[]
    handleRole: (userId: number, role: SelectOption | null) => void
    setOpenModal: React.Dispatch<React.SetStateAction<{ userId: number | null, isOpen: boolean }>>
}

interface ActionManageProps extends Omit<UserColumnProps, 'roles' | 'handleRole'> {
    row: CellContext<User, unknown>['row'],
}

const ActionManage = ({ row, setOpenModal }: ActionManageProps) => {
    const isActive = row.original.status === 'active' ? true : false

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => setOpenModal((prev) => ({ userId: row.original.id, isOpen: !prev.isOpen }))}
                className="relative w-16 h-8 cursor-pointer rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-30"
                style={{
                    backgroundColor: isActive ? '#10b981' : '#ef4444',
                    boxShadow: isActive
                        ? '0 0px 0px 0 rgba(16, 185, 129, 0.39)'
                        : '0 0px 0px 0 rgba(239, 68, 68, 0.39)'
                }}
                aria-label={`Toggle ${isActive ? 'on' : 'off'}`}
            >
                <div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full  transition-all duration-300 ease-in-out flex items-center justify-center"
                    style={{
                        transform: isActive ? 'translateX(32px)' : 'translateX(0)'
                    }}
                >
                    {isActive ? (
                        <Check
                            className="w-4 h-4 transition-all duration-200"
                            style={{ color: '#10b981' }}
                            strokeWidth={3}
                        />
                    ) : (
                        <X
                            className="w-4 h-4 transition-all duration-200"
                            style={{ color: '#ef4444' }}
                            strokeWidth={3}
                        />
                    )}
                </div>

                <input
                    type="radio"
                    name="toggle-radio"
                    value={''}
                    checked={isActive}
                    onChange={() => console.log('onchnage radio')}
                    className="sr-only"
                />
            </button>
        </div>
    )
}

export const usersColumn = ({ roles, setOpenModal, handleRole }: UserColumnProps): ColumnDef<User>[] => {
    return [
        {
            accessorKey: 'name',
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
                            <p className='text-neutral-400'>user_todo_email@company.ac.id</p>
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
                const RoleOptions: SelectOption[] = roles.map((role) => ({
                    value: role.id,
                    code: role.id,
                    label: role.name,
                }))

                return (
                    <UserSelect
                        defaultValue={RoleOptions.find((role) => role.value === row.original.role_id)}
                        items={RoleOptions}
                        onValueChange={(values) => handleRole(row.original.id, values ?? null)}
                        placeholder='Cari peran...'
                    />
                )
            }
        },
        {
            accessorKey: 'presence',
            header: 'Status di ruangan rapat',
            minSize: 345,
            maxSize: 345,
            cell: ({ row }) => {
                const presence: string[] = row.original.presence || [];
                const examplePresence = [...presence, 'idle - ruangan pimpinan', 'banned - Ruangan dux',]

                const getBadgeConfig = (statusStr: string) => {
                    const lowerStr = statusStr.toLowerCase();

                    // Multi Value Array Handling
                    if (lowerStr.includes('idle') || lowerStr.includes('menunggu') || lowerStr.includes('waiting')) {
                        const cleanLabel = statusStr.replace(/idle/i, 'Menunggu Persetujuan');
                        return {
                            label: cleanLabel,
                            variant: 'outline' as const,
                        };
                    }

                    if (lowerStr.includes('banned') || lowerStr.includes('block') || lowerStr.includes('diblokir')) {
                        const cleanLabel = statusStr.replace(/banned/i, 'Diblokir');
                        return {
                            label: cleanLabel,
                            variant: 'destructive' as const,
                        };
                    }

                    // Single Value Array Handling
                    if (lowerStr.includes('menunggu') || lowerStr.includes('waiting') || lowerStr === 'idle') {
                        return {
                            label: statusStr === 'idle' ? 'Menunggu Persetujuan' : statusStr,
                            variant: 'outline' as const,
                        };
                    }

                    if (lowerStr === 'available' || lowerStr === 'tersedia') {
                        return {
                            label: 'Tersedia',
                            variant: 'default' as const,
                        };
                    }

                    return {
                        label: statusStr,
                        variant: 'secondary' as const,
                    };
                };

                return (
                    <div className="flex flex-wrap gap-2">
                        {examplePresence.map((status, index) => {
                            const config = getBadgeConfig(status);
                            return (
                                <Badge key={index} variant={config.variant}>
                                    {config.label}
                                </Badge>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            minSize: 100,
            maxSize: 100,
            header: () => {
                return (
                    <div className='flex items-center gap-2'>
                        Kelola
                        <Tooltip>
                            <TooltipTrigger asChild className='cursor-pointer'>
                                <Info className='size-3.5' />
                            </TooltipTrigger>
                            <TooltipContent className='bg-red-800'>
                                Kelola pengguna di sini berfungsi untuk menonaktifkan
                                pengguna dari dashboard konferensi kelas. <br />
                                Sehingga pengguna tidak dapat mengikuti rapat manapun
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )
            },
            cell: ({ row }) => <ActionManage {...{ row, setOpenModal }} />,
            enableSorting: false,
        },
    ]
}

