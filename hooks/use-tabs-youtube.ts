import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { omit, qstring } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { parseYoutubeURL } from '@/feat/helpers'
import { ScreenCode, SearchParamsKey } from '@/feat/enum'

export function useTabsYoutube() {
  const { screen, isHost, startActiveScreen, stopActiveScreen } = useRoomState()
  const { router, pathname, currentParams } = useParamsState()
  const isYoutubeWatching = screen?.id === ScreenCode.WatchYoutube
  const [url, setUrl] = useState(isYoutubeWatching ? (screen?.url ?? '') : '')
  const [isPlayed, setIsPlayed] = useState(!!url)
  const { match } = parseYoutubeURL(url)
  const urlRef = useRef(url)
  const isStartSharingRef = useRef(false)
  const preventUpdate = !!screen && (!isHost || !isYoutubeWatching)

  const youtubeToggleEvent = useEffectEvent(async (played: boolean) => {
    if (preventUpdate) return

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
    preventUpdate,
    isPlayed,
    match,
    urlRef,
    isStartSharingRef,
    setUrl,
    setIsPlayed,
  }
}
