'use client'

import type { FC } from 'react'
import { useTabsParticipant } from '@/hooks/use-tabs-participant'
import {
  TabsListGroup,
  TabsListItem,
  TabsListItemContent,
  TabsListItemText,
  TabsListItemTitle,
} from '@/feat/Tabs/List'

export const TabsSettingsParticipants: FC = () => {
  const { participantGroups } = useTabsParticipant()

  return participantGroups.map(({ id, lists }) => (
    <TabsListGroup className='space-y-4' key={id}>
      {lists.map(({ id: identity, name, roleName, isBanned }) => (
        <TabsListItem
          key={identity}
          className='relative flex items-center justify-between px-2 py-[4.5px]'
        >
          <div className='flex h-10 w-10 shrink-0 grow-0 items-center justify-center rounded-full border border-neutral-400 bg-red-50'>
            <span className='font-semibold text-red-800 uppercase'>{name.slice(0, 2)}</span>
          </div>

          <TabsListItemContent className='flex h-fit flex-1 flex-col'>
            <TabsListItemTitle className='wrap-anywhere'>{name}</TabsListItemTitle>
            <TabsListItemText className='flex gap-1 text-xs wrap-anywhere text-neutral-400 capitalize'>
              {roleName === 'user' ? 'Peserta' : roleName} {isBanned && '|'}
              {isBanned && <span className='text-error text-xs'>Diblokir</span>}
            </TabsListItemText>
          </TabsListItemContent>
        </TabsListItem>
      ))}
    </TabsListGroup>
  ))
}
