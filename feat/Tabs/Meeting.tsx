'use client'

import type { FC } from 'react'
import { useState } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
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
  TabsListItemContentRecord,
} from '@/feat/Tabs/List'
import { TabsMeetingIcon } from '@/feat/Tabs/Icon'
import { ScreenCode } from '@/feat/enum'
import { Modal } from '@/components/ui/modal'

export const TabsMeeting: FC = () => {
  const { activeScreen, isHostScreen, isHostRecord, items } = useTabsMeeting()
  const [confirmRecord, setConfirmRecord] = useState(false)

  return (
    <TabsListGroups>
      {items.map(({ id, headline, lists }) => (
        <TabsListGroup key={id}>
          <TabsListTitle>{headline}</TabsListTitle>
          <TabsList>
            {lists.map(({ id, code, title, description, onRecord, icon, handle }) => (
              <TabsListItem key={id}>
                {code <= 0 && <TabsListItemAction onClick={handle} />}
                <TabsListItemIcon>
                  <TabsMeetingIcon name={icon} />
                </TabsListItemIcon>
                {code === ScreenCode.Recording ? (
                  <TabsListItemContentRecord {...{ title, description, onRecord }} />
                ) : (
                  <TabsListItemContent>
                    <TabsListItemTitle>{title}</TabsListItemTitle>
                    <TabsListItemText>{description}</TabsListItemText>
                  </TabsListItemContent>
                )}

                {!code ? (
                  <CaretRightIcon size={16} />
                ) : (
                  code > 0 &&
                  (typeof onRecord === 'undefined' ? (
                    <TabsListItemActionStart
                      onClick={handle}
                      disabled={isHostScreen ? activeScreen !== code : !!activeScreen}
                    >
                      {isHostScreen && activeScreen === code ? 'Berhenti' : 'Mulai'}
                    </TabsListItemActionStart>
                  ) : (
                    <Modal
                      title={{ children: 'Rapat ini akan segera direkam' }}
                      root={{
                        open: confirmRecord,
                        onOpenChange: () => setConfirmRecord(!onRecord),
                      }}

                      trigger={{
                        asChild: true,
                        children: (
                          <TabsListItemActionRecord
                            disabled={!isHostRecord ? onRecord : void 0}
                            onClick={(event) => {
                              if (onRecord) handle(event) // untuk stop record karena modal tidak terbuka
                            }}
                          >
                            <div
                              className={cn(
                                'border-error relative size-7 rounded-full border',
                                isHostRecord && onRecord && 'bg-error'
                              )}
                            >
                              <span
                                className={cn(
                                  'bg-error absolute top-1/2 left-1/2 size-3.5 -translate-1/2 rounded-full',
                                  isHostRecord && onRecord && 'animate-pulse bg-white'
                                )}
                              ></span>
                            </div>
                          </TabsListItemActionRecord>
                        ),
                      }}
                      submit={{
                        children: 'Ok',
                        className: 'w-full!',
                        onClick: (event) => {
                          if (!onRecord) {
                            handle(event)
                          }
                          setConfirmRecord(false)
                        },
                      }}
                      cancel={{ hidden: true }}
                      close={{ hidden: true }}
                      content={{
                        className: 'max-w-90',
                        onInteractOutside: (event) => event.preventDefault(),
                        onCloseAutoFocus: (event) => event.preventDefault(),
                      }}
                    >
                      <p className='text-xs'>
                        Mohon konfirmasi bahwa semua peserta telah diinformasikan dan telah
                        menyetujui perekaman ini, termasuk tamu mana pun yang mungkin bergabung
                        nanti.
                      </p>
                    </Modal>
                  ))
                )}
              </TabsListItem>
            ))}
          </TabsList>
        </TabsListGroup>
      ))}
    </TabsListGroups>
  )
}
