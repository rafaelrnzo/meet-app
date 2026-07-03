'use client'

import type { ComponentProps, FC, ReactNode } from 'react'
import { ConnectionState } from 'livekit-client'
import { ArrowLeftIcon, XIcon } from '@phosphor-icons/react'
import { useConnectionState, useRoomContext } from '@livekit/components-react'
import { cn } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { TabsNotes } from '@/feat/Tabs/Notes'
import { TabsChat } from '@/feat/Tabs'
import { TabsCode } from '@/feat/enum'
import { RoomTabsTools, RoomTabs } from '@/feat/const'

const RoomPanelComponent: FC<{ children?: ReactNode }> = ({ children }) => {
  const { tabsCode } = useParamsState()
  const room = useRoomContext()
  const state = useConnectionState(room)
  const exludedTabs = [TabsCode.TabsMeetingNotes, TabsCode.TabsChats]

  return (
    <div
      className={cn(
        'relative grid grow auto-cols-[100%] grid-flow-col transition-transform duration-300 *:min-w-full',
        TabsCode.TabsChats !== tabsCode && 'overflow-x-hidden overflow-y-auto *:p-5'
      )}
    >
      {/* {hasChild && <div></div>} */}
      {!exludedTabs.includes(tabsCode) && children}
      {state !== ConnectionState.Connecting && (
        <>
          <TabsNotes />
          <TabsChat />
        </>
      )}
    </div>
  )
}

const RoomPanelHeader: FC = () => {
  const { tabsCode, openTab, closePanel } = useParamsState()
  const title = RoomTabsTools.find((copy) => copy.tabIds.includes(tabsCode))?.title ?? ''
  const currentTab = RoomTabs.find(({ id }) => id === tabsCode)
  const parentId = currentTab?.parentId
  const hasChild = !!parentId

  return (
    <div className='flex flex-col px-5 pt-5'>
      <div className='flex items-center justify-between'>
        {hasChild && (
          <button
            className='text-primary mr-1 flex size-6 cursor-pointer items-center justify-center hover:not-disabled:opacity-40'
            onClick={() => openTab(parentId)}
          >
            <ArrowLeftIcon />
          </button>
        )}
        <h2 className={cn('text-primary mr-auto font-semibold', hasChild && '-translate-x-1')}>
          {title}
        </h2>
        <button
          type='button'
          className='text-destructive inline-flex size-11 cursor-pointer items-center justify-center rounded-md bg-red-200 hover:bg-red-300'
          onClick={closePanel}
        >
          <XIcon size={20} />
        </button>
      </div>
      {currentTab?.description && <p className='pr-11 text-sm'>{currentTab.description}</p>}
      <hr className='border-primary mt-6 mb-1 border' />
    </div>
  )
}

export const RoomPanel: FC<ComponentProps<'aside'>> = ({ className, children, ...props }) => {
  const { isPanelActive } = useParamsState()
  const room = useRoomContext()
  const state = useConnectionState(room)
  const isConnecting = state === ConnectionState.Connecting

  return (
    <aside
      inert={isConnecting || !isPanelActive}
      className={cn(
        'text-foreground fixed top-3 right-3 bottom-16 left-3 z-10 flex flex-col overflow-hidden rounded-md border shadow md:left-auto md:w-100 md:max-w-100',
        (isConnecting || !isPanelActive) && 'hidden',
        className
      )}
      {...props}
    >
      <RoomPanelHeader />
      <RoomPanelComponent>{children}</RoomPanelComponent>
    </aside>
  )
}
