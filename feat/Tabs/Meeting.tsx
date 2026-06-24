'use client'

import type { FC } from 'react'
import { RecordIcon, StopIcon } from '@phosphor-icons/react'
import { useTabsMeeting } from '@/hooks'
import {
  TabsList,
  TabsListItemContent,
  TabsListGroup,
  TabsListItemIcon,
  TabsListItem,
  TabsListTitle,
  TabsListItemText,
  TabsListItemTitle,
  TabsListGroups,
  TabsListItemAction,
  TabsListItemActionStart,
  TabsListItemActionRecord,
} from '@/feat/Tabs/List'
import { TabsMeetingIcon } from '@/feat/Tabs/Icon'

export const TabsMeeting: FC = () => {
  const { activeScreen, isHostScreen, isHostRecord, items } = useTabsMeeting()

  return (
    <TabsListGroups>
      {items.map(({ id, headline, lists }) => (
        <TabsListGroup key={id}>
          <TabsListTitle>{headline}</TabsListTitle>
          <TabsList>
            {lists.map(({ id, code, title, description, onRecord, icon, handle }) => (
              <TabsListItem key={id}>
                {!code && <TabsListItemAction onClick={handle} />}
                <TabsListItemIcon>
                  <TabsMeetingIcon name={icon} />
                </TabsListItemIcon>
                <TabsListItemContent>
                  <TabsListItemTitle>{title}</TabsListItemTitle>
                  <TabsListItemText>{description}</TabsListItemText>
                </TabsListItemContent>
                {code > 0 &&
                  (typeof onRecord === 'undefined' ? (
                    <TabsListItemActionStart
                      onClick={handle}
                      disabled={isHostScreen ? activeScreen !== code : !!activeScreen}
                    >
                      {isHostScreen && activeScreen === code ? 'Berhenti' : 'Mulai'}
                    </TabsListItemActionStart>
                  ) : (
                    <TabsListItemActionRecord
                      disabled={!isHostRecord ? onRecord : void 0}
                      onClick={handle}
                    >
                      {isHostRecord && onRecord ? (
                        <StopIcon size={27} weight='fill' />
                      ) : (
                        <RecordIcon size={27} weight='fill' />
                      )}
                    </TabsListItemActionRecord>
                  ))}
              </TabsListItem>
            ))}
          </TabsList>
        </TabsListGroup>
      ))}
    </TabsListGroups>
  )
}
