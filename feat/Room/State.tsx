'use client'

import type { Doc } from 'yjs'
import type { FC, ReactNode } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import type { ScreenCode } from '@/feat/enum'
import { createContext, useContext, useEffect, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useMaybeRoomContext } from '@livekit/components-react'
import { loginfo, num } from '@/lib/utils'
import { ParticipantAttribute } from '@/feat/enum'

export type ScreenID = Exclude<ScreenCode, ScreenCode.Recording>

export interface PresentationContext {
  getSnapshot: () => number
  loadSnapshot: (page: number) => void
}

export interface ScreenMessage {
  id: ScreenID
  host: string
  url?: string
  polling?: string
}

export type ScreenPayload = Partial<Record<'url' | 'polling', string>>

export interface StateContextProps {
  screen: ScreenMessage | null
  record: string | null
  isHost: boolean
  ydoc: Doc | null
  startActiveScreen: (code: ScreenID, payload?: ScreenPayload) => Promise<void>
  stopActiveScreen: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

export const StateContext = createContext<StateContextProps>(undefined!)
export const useRoomState = () => useContext(StateContext)

export const RoomState: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useMaybeRoomContext()
  const [ydoc, setYdoc] = useState<Doc | null>(null)
  const [screen, setScreen] = useState<StateContextProps['screen'] | null>(null)
  const [record, setRecord] = useState<StateContextProps['record'] | null>(null)
  const isHost = room?.localParticipant.identity === screen?.host

  const startRecording = async () => {
    if (!room?.localParticipant) return
    try {
      await room.localParticipant.setAttributes({
        [ParticipantAttribute.ScreenRecord]: room.localParticipant.identity,
      })
    } catch (e) {
      console.log('Failed to start recording:', e)
    }
  }

  const stopRecording = async () => {
    if (!room?.localParticipant) return
    try {
      await room.localParticipant.setAttributes({
        [ParticipantAttribute.ScreenRecord]: '',
      })
    } catch (e) {
      console.log('Failed to stop recording:', e)
    }
  }

  const startActiveScreen = async (
    code: ScreenID,
    payload?: Partial<Record<'url' | 'polling', string>>
  ) => {
    if (!room?.localParticipant) return
    try {
      const url = payload?.url
      const polling = payload?.polling

      await room.localParticipant.setAttributes({
        [ParticipantAttribute.ScreenActive]: String(code),
        [ParticipantAttribute.ScreenActiveHost]: room.localParticipant.identity,
        ...(url ? { [ParticipantAttribute.ScreenActiveUrl]: url } : {}),
        ...(polling ? { [ParticipantAttribute.ScreenActivePolling]: polling } : {}),
      })
    } catch (e) {
      console.log('Failed to start active screen:', e)
    }
  }

  const stopActiveScreen = async () => {
    if (!room?.localParticipant) return
    try {
      await room.localParticipant.setAttributes({
        [ParticipantAttribute.ScreenActive]: '',
        [ParticipantAttribute.ScreenActiveHost]: '',
        [ParticipantAttribute.ScreenActiveUrl]: '',
        [ParticipantAttribute.ScreenActivePolling]: '',
      })
    } catch (e) {
      console.log('Failed to stop active screen:', e)
    }
  }

  useEffect(() => {
    if (!room) return

    const syncRoomState = () => {
      let newScreen: StateContextProps['screen'] = null
      let newRecord: StateContextProps['record'] = null

      // REMEMBER TO SCAN BOTH LOCALPARTICIPANT + REMOTEPARTICIPAN
      const allParticipants = [
        room.localParticipant,
        ...Array.from(room.remoteParticipants.values()),
      ]

      allParticipants.forEach((participant) => {
        const currentScreen = num(participant.attributes?.[ParticipantAttribute.ScreenActive])
        const url = participant.attributes?.[ParticipantAttribute.ScreenActiveUrl]
        const polling = participant.attributes?.[ParticipantAttribute.ScreenActivePolling]

        if (currentScreen) {
          const payload = { id: currentScreen, host: participant.identity }
          newScreen = url ? { ...payload, url } : payload
          newScreen = polling ? { ...newScreen, polling } : newScreen
        }

        const hostId = participant.attributes?.[ParticipantAttribute.ScreenRecord]
        if (hostId) {
          newRecord = hostId
        }
      })

      setScreen((prev) => {
        const prevId = num(prev?.id)
        const idNow = num(newScreen?.id)
        if (prevId !== idNow) {
          if (!idNow) loginfo(`Active screen ended`)
          else loginfo(`Active screen changed: ${prevId} -> ${idNow}`, newScreen ?? 0)
        }
        return newScreen
      })

      setRecord((prev) => {
        if (prev !== newRecord) {
          if (!newRecord) loginfo(`Recording ended`)
          else loginfo(`Recording started by ${newRecord}`)
        }
        return newRecord
      })
    }

    const handleLeavingHost = ({ attributes, identity }: RemoteParticipant) => {
      const wasScreenHost =
        ParticipantAttribute.ScreenActiveHost in attributes &&
        attributes[ParticipantAttribute.ScreenActiveHost] === identity

      const wasRecordHost =
        ParticipantAttribute.ScreenRecord in attributes &&
        attributes[ParticipantAttribute.ScreenRecord] === identity

      if (wasScreenHost || wasRecordHost) {
        syncRoomState()
      }
    }

    const loadYdoc = async () => {
      if (ydoc) return

      try {
        const { Doc } = await import('yjs')
        setYdoc(new Doc())
      } catch (e) {
        console.log('Failed to load yDoc:', e)
      }
    }

    loadYdoc()
    room.on(RoomEvent.Connected, syncRoomState)
    room.on(RoomEvent.LocalTrackPublished, syncRoomState)
    room.on(RoomEvent.ParticipantAttributesChanged, syncRoomState)
    room.on(RoomEvent.ParticipantDisconnected, handleLeavingHost)

    return () => {
      ydoc?.destroy()
      room.off(RoomEvent.Connected, syncRoomState)
      room.off(RoomEvent.LocalTrackPublished, syncRoomState)
      room.off(RoomEvent.ParticipantAttributesChanged, syncRoomState)
      room.off(RoomEvent.ParticipantDisconnected, handleLeavingHost)
    }
  }, [room, ydoc])

  return (
    <StateContext.Provider
      value={{
        screen,
        record,
        isHost,
        ydoc,
        startRecording,
        stopRecording,
        startActiveScreen,
        stopActiveScreen,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}
