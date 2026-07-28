'use client'

import type { MouseEvent } from 'react'
import type { ScreenID } from '@/feat/Room'
import type { TabsContentList } from '@/feat/const'
import {
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useRoomInfo,
} from '@livekit/components-react'
import { encoder } from '@/lib/utils'
import { getPresentationUrl } from '@/lib/api/admin-api'
import { useRoomsAuth, useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { GroupCode, LiveKitAction, ParticipantAttribute, ScreenCode } from '@/feat/enum'
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
  const { localParticipant } = useLocalParticipant()
  const role = localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()]
  const roomId: { room_id: number } = roomInfo.metadata ? JSON.parse(roomInfo.metadata) : ''
  const remoteParticipants = useRemoteParticipants()
  const { hasPermissionInMeeting } = useRoomsAuth()
  const { screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen } =
    useRoomState()
  const { closePanel, openTabsPolling, openTabsNotes, openTabsWatchYoutube } = useParamsState()

  function handleTogglePickUser() {
    return async () => {
      if (!room) return

      const participants = remoteParticipants
        .filter(({ attributes }) => {
          const attributesRole = attributes[ParticipantAttribute.RoleName.toLowerCase()]
          return attributesRole === 'user'
        })
        .map((member) => ({
          name: member.name ?? 'Unknown',
          identity: member.identity,
        }))

      if (!participants.length) {
        return toast.pick('Tidak ada peserta', { position: 'top-center' })
      }

      const randomIndex = Math.floor(Math.random() * participants.length)
      const { name, identity } = participants[randomIndex]
      const overflowName = name.length > 20 ? name.slice(0, 20) + '...' : name

      // Broadcast reset dismiss for all participant
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify({ action: LiveKitAction.PickUserReset, payload: name })),
        { reliable: false }
      )

      // Broadcast only for selected pick
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify({ action: LiveKitAction.PickUser, payload: name })),
        {
          reliable: false,
          destinationIdentities: [identity],
        }
      )

      const histories = toast.getHistory()
      histories.forEach((hist) => {
        if (
          ('duration' in hist && hist.duration === Infinity) ||
          (hist.id + '').startsWith(`partcipant-${identity}`)
        ) {
          toast.dismiss(hist.id)
        }
      })

      toast.pick(`${overflowName} telah dipilih`, {
        id: `partcipant-${identity}-${Date.now()}`,
        position: 'top-center',
        duration: Infinity,
      })
    }
  }

  function handleToggleActiveScreen(id: ScreenID) {
    return async (e: MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget
      const prevText = target.textContent

      if (screen?.id === id) {
        return stopActiveScreen()
      }

      const error = { message: '' }
      const action = {
        [ScreenCode.WatchYoutube]: async () => {
          // Moved to screen WatchYoutube.tsx handler
        },
        [ScreenCode.Presentation]: async () => {
          const { data: file_url, message } = await getPresentationUrl(roomId.room_id)
          if (file_url) {
            await startActiveScreen(id, { url: file_url })
          } else {
            error.message =
              message === 'no presentation uploaded'
                ? 'Tidak ada file yang di unggah'
                : (message ?? '')
          }
        },
      }

      if (id in action) {
        target.disabled = true
        target.textContent = 'Memulai...'

        // Fire action
        await action[id as keyof typeof action]()

        if (error.message) {
          toast.error(error.message, { position: 'top-center' })
          target.textContent = prevText
        }

        target.disabled = false
      } else {
        await startActiveScreen(id)
      }

      if (!error.message) closePanel()
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
    items: TabsContents(role ?? '', hasPermissionInMeeting)
      .filter(({ hide }) => !hide)
      .map((content) => ({
        ...content,
        lists: content.lists.filter((list) => !list.hide).map(remapContent),
      })),
  }
}
