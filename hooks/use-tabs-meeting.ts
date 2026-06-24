import type { MouseEvent } from 'react'
import type { ScreenID } from '@/feat/Room'
import type { TabsContentList } from '@/feat/const'
import { useRoomContext } from '@livekit/components-react'
import { useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { GroupCode, ScreenCode } from '@/feat/enum'
import { TabsContents } from '@/feat/const'
import { getRemoteUrl } from '@/feat/api'

export interface ImperativeContent {
  code: 0 | ScreenCode
  onRecord?: boolean
  handle: (e: MouseEvent<HTMLButtonElement>) => void
}

export function useTabsMeeting() {
  const room = useRoomContext()
  const { screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen } =
    useRoomState()
  const { closePanel, openTabsPolling, openTabsNotes } = useParamsState()

  function handleToggleActiveScreen(id: ScreenID) {
    return async (e: MouseEvent<HTMLButtonElement>) => {
      let success = true

      if (screen?.id === id) {
        if (!confirm('Apakah anda yakin ingin mengakhiri sesi ini?')) {
          return e.preventDefault()
        }

        return stopActiveScreen()
      }

      if (id === ScreenCode.WatchYoutube || id === ScreenCode.Presentation) {
        const target = e.currentTarget
        const prevtext = target.textContent

        target.disabled = true
        target.textContent = 'Memulai...'

        const { data } = await getRemoteUrl(id)

        if (data?.url) {
          await startActiveScreen(id, { url: data.url })
        } else {
          // May add toast error here
          success = false
        }

        target.disabled = false
        target.textContent = prevtext
      } else {
        await startActiveScreen(id)
      }

      if (success) {
        closePanel()
      }
    }
  }

  function remapContent(list: TabsContentList) {
    let prop: ImperativeContent = {
      code: 0,
      handle: () => console.warn('one of "TabsContentList" is not been handle'),
    }

    switch (list.id) {
      case GroupCode.Notes:
        prop = { ...prop, handle: openTabsNotes }
        break
      case GroupCode.Polling:
        prop = { ...prop, handle: openTabsPolling }
        break
      case GroupCode.Whiteboard:
        prop = {
          ...prop,
          code: ScreenCode.Whiteboard,
          handle: handleToggleActiveScreen(ScreenCode.Whiteboard),
        }
        break
      case GroupCode.Presentation:
        prop = {
          ...prop,
          code: ScreenCode.Presentation,
          handle: handleToggleActiveScreen(ScreenCode.Presentation),
        }
        break
      case GroupCode.WatchYoutube:
        prop = {
          ...prop,
          code: ScreenCode.WatchYoutube,
          handle: handleToggleActiveScreen(ScreenCode.WatchYoutube),
        }
        break
      case GroupCode.Recording:
        prop = {
          ...prop,
          code: ScreenCode.Recording,
          onRecord: !!record,
          handle: record ? stopRecording : startRecording,
        }
        break
      case GroupCode.PickRandom:
        // Not defined yet
        break
      default: {
        const _exhaustiveCheck: never = list.id
        return _exhaustiveCheck
      }
    }

    return { ...list, ...prop }
  }

  return {
    activeScreen: screen?.id,
    isHostScreen: room.localParticipant.identity === screen?.host,
    isHostRecord: room.localParticipant.identity === record,
    items: TabsContents.filter(({ hide }) => !hide).map((content) => ({
      ...content,
      lists: content.lists.filter((list) => !list.hide).map(remapContent),
    })),
  }
}
