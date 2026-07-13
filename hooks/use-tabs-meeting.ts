'use client'

import type { MouseEvent } from 'react'
import type { ScreenID } from '@/feat/Room'
import type { TabsContentList } from '@/feat/const'
import { useRemoteParticipants, useRoomContext, useRoomInfo } from '@livekit/components-react'
import { encoder } from '@/lib/utils'
import { getPresentationUrl } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { GroupCode, LiveKitAction, ScreenCode } from '@/feat/enum'
import { TabsContents } from '@/feat/const'
import { toast } from '@/components/ui/sonner'

export interface ImperativeContent {
  code: 0 | ScreenCode
  onRecord?: boolean
  handle: (e: MouseEvent<HTMLButtonElement>) => void
}

export function useTabsMeeting() {
  const room = useRoomContext()
  const roomInfo = useRoomInfo()
  const roomId: { room_id: number } = roomInfo.metadata ? JSON.parse(roomInfo.metadata) : ''
  const remoteParticipants = useRemoteParticipants()
  const { role } = useAuth()
  const { screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen } =
    useRoomState()
  const { openTabsPolling, openTabsNotes, openTabsWatchYoutube } = useParamsState()

  function truncateName(name: string, length: number) {
    return name.length > length ? name.slice(0, length) + '...' : name
  }

  function handleTogglePickUser() {
    return async () => {
      if (!room) return

      const participants = remoteParticipants.map((participant) => ({
        name: participant.name ?? 'Unknown',
        identity: participant.identity,
      }))

      if (!participants.length) {
        return toast.pick('Tidak ada peserta', { position: 'top-center' })
      }

      const randomIndex = Math.floor(Math.random() * participants.length)
      const choosenUser = participants[randomIndex]

      await room.localParticipant.publishData(
        encoder.encode(
          JSON.stringify({ action: LiveKitAction.PickUserReset, payload: choosenUser.name })
        ),
        { reliable: false }
      )

      await room.localParticipant.publishData(
        encoder.encode(
          JSON.stringify({ action: LiveKitAction.PickUser, payload: choosenUser.name })
        ),
        {
          reliable: false,
          destinationIdentities: [choosenUser.identity],
        }
      )

      toast.dismiss()
      toast.pick(`${truncateName(choosenUser.name ?? 'unknown', 20)} telah dipilih`, {
        position: 'top-center',
        duration: Infinity,
      })
    }
  }

  function handleToggleActiveScreen(id: ScreenID) {
    return async (e: MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget

      if (screen?.id === id) {
        if (!confirm('Apakah anda yakin ingin mengakhiri sesi ini?')) {
          return e.preventDefault()
        }

        return stopActiveScreen()
      }

      const error = { message: '' }
      const action = {
        [ScreenCode.WatchYoutube]: async () => {
          // Moved to screen WatchYoutube.tsx handler
        },
        [ScreenCode.Presentation]: async () => {
          try {
            const { file_url } = await getPresentationUrl(roomId.room_id)
            await startActiveScreen(id, { url: file_url })
          } catch (e) {
            error.message = e instanceof Error ? e.message : 'Tidak ada file yang di unggah'
          }
        },
      }

      if (id in action) {
        target.disabled = true
        target.textContent = 'Memulai...'

        // Fire action
        await action[id as keyof typeof action]()

        if (error.message) {
          toast.error(error.message)
        }

        target.disabled = false
      } else {
        await startActiveScreen(id)
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
          handle: openTabsWatchYoutube,
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
        prop = {
          ...prop,
          handle: handleTogglePickUser(),
        }
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
    items: TabsContents(role ? role.name : '')
      .filter(({ hide }) => !hide)
      .map((content) => ({
        ...content,
        lists: content.lists.filter((list) => !list.hide).map(remapContent),
      })),
  }
}
