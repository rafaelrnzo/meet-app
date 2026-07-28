'use client'

import type { FC } from 'react'
import { cn, djs } from '@/lib/utils'
import { useTabsSettingRooms } from '@/hooks'
import { Icon } from '@/components/ui/icon'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const TabsSettingsRooms: FC = () => {
  const { rooms } = useTabsSettingRooms()

  return (
    <div className='space-y-4'>
      {rooms.map((room) => (
        <Card
          className={cn('flex flex-col space-y-4 rounded-md border-neutral-200 p-5')}
          key={room.room_code}
        >
          <CardHeader className='relative grow gap-4 space-y-0 p-0'>
            <div className='flex flex-wrap items-center justify-between'>
              <CardTitle className='mb-0 min-w-1/2 flex-1 truncate text-base font-semibold text-red-800'>
                {room.name}
              </CardTitle>
              <div className='flex items-center gap-2'>
                {room.group?.name && (
                  <Badge
                    variant='outline'
                    className='bg-green-50 wrap-anywhere text-neutral-950 not-italic'
                  >
                    {room.group.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className='flex items-center justify-between gap-2 text-sm'>
              <div className='flex items-center gap-2'>
                <Icon type='calendar' className='text-neutral-400' />
                {`${djs(room.start_date).format('DD MMMM YYYY, HH.mm')} WIB`}
              </div>
              <div className='flex items-center gap-2'>
                <Icon type='users' className='text-neutral-400' />
                <span>
                  {room.participants ?? 0}/{room.max_participants ?? 0}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
