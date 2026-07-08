'use client'

import type { MouseEvent } from 'react'
import type { FileResponse } from '@/feat/rooms/dto'
import type { ScreenID } from '@/feat/Room'
import type { TabsContentList } from '@/feat/const'
import { useContext, useEffect, useState } from 'react'
import { useParticipants, useRoomContext, useRoomInfo } from '@livekit/components-react'
import { getOnePresentation } from '@/lib/api/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { useParamsState } from '@/hooks'
import { PickUserContext, useRoomState } from '@/feat/Room'
import { GroupCode, ParticipantAttribute, ScreenCode } from '@/feat/enum'
import { TabsContents } from '@/feat/const'
import { getRemoteUrl } from '@/feat/api'
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
  const usePickUserContext = useContext(PickUserContext)
  const remoteParticipants = useParticipants()
  const { role } = useAuth()
  const [files, setFiles] = useState<FileResponse[]>([])
  const { screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen } =
    useRoomState()
  const { closePanel, openTabsPolling, openTabsNotes } = useParamsState()
  const truncateName = (name: string, length: number) => {
    return name.length > length ? name.slice(0, length) + '...' : name
  }

  const loadPresentations = async () => {
    try {
      const file = await getOnePresentation(roomId.room_id || 0)
      setFiles(Array.isArray(file) ? file : file ? [file] : [])
    } catch (error) {
      console.error('Failed to load data', error)
    }
  }

  useEffect(() => {
    if (roomId.room_id) {
      loadPresentations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId.room_id])

  async function handleTogglePickUser() {
    if (!room || !remoteParticipants) return

    const participants = Array.from(remoteParticipants.values()).filter(({ attributes }) => {
      const attributesRole = attributes[ParticipantAttribute.RoleName.toLowerCase()]
      return attributesRole === 'user'
    })
    if (participants.length === 0)
      return toast.pick('Tidak ada peserta', {
        position: 'top-center',
      })

    const randomIndex = Math.floor(Math.random() * participants.length)
    const choosenUser = participants[randomIndex]
    usePickUserContext?.sendPickUser(
      JSON.stringify({
        name: choosenUser.name ?? 'unknown',
        identity: choosenUser.identity ?? 'unknown',
      }),
      {
        reliable: true,
      }
    )
    toast.pick(`${truncateName(choosenUser.name ?? 'unknown', 20)} telah dipilih`, {
      position: 'top-center',
    })
  }

  function handleToggleActiveScreen(id: ScreenID) {
    return async (e: MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget
      if (screen?.id === id) {
        return stopActiveScreen()
      }

      if (id === ScreenCode.WatchYoutube || id === ScreenCode.Presentation) {
        if (!files.length) return toast.error('Tidak ada berkas presentasi yang di unggah')

        try {
          target.disabled = true
          target.textContent = 'Memulai...'

          const { data } = await getRemoteUrl(
            {
              yt: 'https://youtu.be/e1QIqXmZ2os?si=Gd9591aZIBoeI3Mi', //dummy
              file: files[0].file_url,
            },
            id
          )
          if (!data) {
            toast.error('Gagal mendapatkan data file')
            return
          }
          await startActiveScreen(id, { url: data.url })
          closePanel()
        } catch (error) {
          console.error('Failed to get path file', error)
        } finally {
          target.disabled = false
          target.textContent = 'Berhenti'
        }
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
        prop = {
          ...prop,
          handle: handleTogglePickUser,
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
