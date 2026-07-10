import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { omit, qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { parseYoutubeURL } from '@/feat/helpers'
import { ScreenCode, SearchParamsKey } from '@/feat/enum'

export function useTabsYoutube() {
  const { screen, startActiveScreen, stopActiveScreen } = useRoomState()
  const { router, pathname, currentParams } = useParamsState()
  const [url, setUrl] = useState(screen?.url ?? '')
  const [isPlayed, setIsPlayed] = useState(!!url)
  const { match } = parseYoutubeURL(url)
  const urlRef = useRef(url)
  const isStartSharingRef = useRef(false)

  const youtubeToggleEvent = useEffectEvent(async (played: boolean) => {
    if (played) {
      await startActiveScreen(ScreenCode.WatchYoutube, { url: urlRef.current })

      if (isStartSharingRef.current) {
        router.replace(
          qstring(pathname, {
            ...omit(currentParams, [SearchParamsKey.PanelCode, SearchParamsKey.TabsCode]),
          })
        )
      }
    } else {
      await stopActiveScreen()
      isStartSharingRef.current = false
    }
  })

  // Sync active screen url by input
  useEffect(() => void youtubeToggleEvent(isPlayed), [isPlayed])

  return {
    url,
    isPlayed,
    match,
    urlRef,
    isStartSharingRef,
    setUrl,
    setIsPlayed,
  }
}
