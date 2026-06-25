'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { User } from '@/lib/api/admin-api'
import { UserPrensence } from '@/feat/users/dto'
import { Tooltip as TooltipBase, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const Tooltip = ({
  trigger,
  content,
}: {
  trigger: React.ReactNode
  content: React.ReactNode
}) => {
  return (
    <TooltipBase>
      <TooltipTrigger className='cursor-pointer'>{trigger}</TooltipTrigger>
      <TooltipContent className='bg-red-800'>{content}</TooltipContent>
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
          <div className='flex min-w-0 flex-row items-center gap-2.5'>
            <Avatar size='lg'>
              <AvatarFallback>{nameAvatar}</AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-col'>
              {isUsernameLong ? (
                <Tooltip
                  trigger={
                    <p className='max-w-[200px] truncate text-left font-semibold'>
                      {displayUsername}
                    </p>
                  }
                  content={<p className='font-semibold text-white'>{username}</p>}
                />
              ) : (
                <p className='max-w-[200px] truncate font-semibold'>{username}</p>
              )}

              {isEmailLong ? (
                <Tooltip
                  trigger={
                    <p className='max-w-[200px] truncate text-left text-xs text-neutral-400'>
                      {displayEmail}
                    </p>
                  }
                  content={<p className='text-xs text-white'>{email}</p>}
                />
              ) : (
                <p className='max-w-[200px] truncate text-xs text-neutral-400'>{email}</p>
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
        const role = (row.original.role?.name as keyof typeof roles) ?? 'user'
        const roles = {
          admin: 'Admin',
          user: 'Peserta',
          moderator: 'Moderator',
        }

        return (
          <Badge
            variant='outline'
            className='rounded border-red-800 bg-red-50 px-3 py-2 text-sm text-red-800 capitalize not-italic'
          >
            {' '}
            {roles[role] ?? role}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'presence',
      header: 'Status di ruangan rapat',
      minSize: 345,
      maxSize: 345,
      enableSorting: false,
      cell: ({ row }) => {
        const presence = row.original.presence || []
        const getBadgeConfig = (statusStr: string) => {
          const lowerStr = statusStr.toLowerCase()

          if (lowerStr.includes(UserPrensence.WAITING)) {
            const cleanLabel = statusStr.replace(/waiting to join/i, 'Menunggu Persetujuan')
            return {
              id: UserPrensence.WAITING,
              label: cleanLabel,
              variant: 'outline' as const,
            }
          }

          if (lowerStr.includes(UserPrensence.BANNED)) {
            const cleanLabel = statusStr.replace(/banned/i, 'Diblokir')
            return {
              id: UserPrensence.BANNED,
              label: cleanLabel,
              variant: 'destructive' as const,
            }
          }

          return {
            id: UserPrensence.IDLE,
            label: statusStr,
            variant: 'secondary' as const,
          }
        }

        return (
          <div className='flex flex-wrap gap-2'>
            {presence.map((status, index) => {
              const config = getBadgeConfig(status)
              const isIdle = config.id === UserPrensence.IDLE
              return isIdle ? (
                '-'
              ) : (
                <Badge key={index} variant={config.variant}>
                  {config.label}
                </Badge>
              )
            })}
          </div>
        )
      },
    },
  ]
}
