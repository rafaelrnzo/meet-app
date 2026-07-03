import { useEffect, useEffectEvent } from 'react'
import { omit, qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { SearchParamsKey } from '@/feat/enum'
import { RoomTabs } from '@/feat/const'

export function useTabEffect() {
  const { router, tabsCode, pathname, currentParams } = useParamsState()

  const redirectInvalidTab = useEffectEvent((tabId: number) => {
    if (!RoomTabs.find((tabs) => tabs.id === tabId)) {
      router.replace(
        qstring(
          pathname,
          omit(currentParams, [SearchParamsKey.TabsCode, SearchParamsKey.PanelCode])
        )
      )
    }
  })

  useEffect(() => redirectInvalidTab(tabsCode), [tabsCode])
}
