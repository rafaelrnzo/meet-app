'use client'

import type { FC } from 'react'
import { default as dynamic } from 'next/dynamic'
import { useParamsState } from '@/hooks'
import { TabsPersistence } from '@/feat/Tabs'
import { Loading } from '@/components/Loading'

const Chat = dynamic(async () => await import('@/feat/Activity/Chat'), {
  ssr: false,
  loading: () => <Loading />,
})

export const TabsChat: FC = () => {
  const { isTabsChats } = useParamsState()

  return (
    <TabsPersistence visible={isTabsChats}>
      <Chat />
    </TabsPersistence>
  )
}
