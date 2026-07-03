'use client'

import type { FC } from 'react'
import { default as dynamic } from 'next/dynamic'
import { useParamsState } from '@/hooks'
import { TabsPersistence } from '@/feat/Tabs'
import { Loading } from '@/components/Loading'

const Notes = dynamic(async () => await import('@/feat/Activity/Notes'), {
  ssr: false,
  loading: () => <Loading />,
})

export const TabsNotes: FC = () => {
  const { isTabsMeetingNotes } = useParamsState()

  return (
    <TabsPersistence visible={isTabsMeetingNotes}>
      <Notes />
    </TabsPersistence>
  )
}
