'use client'

import type { FC, ReactNode } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import type { ScreenCode } from '@/feat/enum'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { useMaybeRoomContext } from '@livekit/components-react'
import { loginfo, num } from '@/lib/utils'
import {
  startRecording as apiStartRecording,
  stopRecording as apiStopRecording,
} from '@/lib/api/admin-api'
import { ParticipantAttribute } from '@/feat/enum'
import { toast } from '@/components/ui/sonner'

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
  startActiveScreen: (code: ScreenID, payload?: ScreenPayload) => Promise<void>
  stopActiveScreen: () => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  recordData: {
    egressId: string
    startedAt?: number
    endedAt?: number
  } | null
}

export const StateContext = createContext<StateContextProps>(undefined!)
export const useRoomState = () => useContext(StateContext)

export const RoomState: FC<{ children?: ReactNode }> = ({ children }) => {
  const room = useMaybeRoomContext()
  const [screen, setScreen] = useState<StateContextProps['screen'] | null>(null)
  const [record, setRecord] = useState<StateContextProps['record'] | null>(null)
  const [recordData, setRecordData] = useState<StateContextProps['recordData']>(null)
  const isHost = room?.localParticipant.identity === screen?.host

  const startRecording = async () => {
    if (!room?.localParticipant) return
    try {
      const response = await apiStartRecording({ room_name: room.name })
      await room.localParticipant.setAttributes({
        [ParticipantAttribute.ScreenRecord]: room.localParticipant.identity,
      })

      setRecordData({
        egressId: response.egress_id,
        startedAt: response.started_at,
      })
    } catch (e) {
      console.log('Failed to start recording:', e)
    }
  }

  const stopRecording = useCallback(async () => {
    if (
      !room?.localParticipant ||
      !recordData?.egressId ||
      room.localParticipant.identity !== record
    ) {
      return
    }

    try {
      const response = await apiStopRecording({
        room_name: room.name,
        egress_id: recordData.egressId,
      })

      if (room.state === ConnectionState.Connected) {
        await room.localParticipant.setAttributes({
          [ParticipantAttribute.ScreenRecord]: '',
        })
      }

      setRecordData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          endedAt: response.ended_at,
        }
      })
    } catch (e) {
      console.log('Failed to stop recording:', e)
    }
  }, [record, recordData?.egressId, room?.localParticipant, room?.name, room?.state])

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

      const histories = toast.getHistory()
      histories.forEach((hist) => {
        if ((hist.id + '').startsWith(`partcipant-${identity}`)) {
          toast.dismiss(hist.id)
        }
      })
    }

    room.on(RoomEvent.Connected, syncRoomState)
    room.on(RoomEvent.LocalTrackPublished, syncRoomState)
    room.on(RoomEvent.ParticipantAttributesChanged, syncRoomState)
    room.on(RoomEvent.ParticipantDisconnected, handleLeavingHost)

    return () => {
      room.off(RoomEvent.Connected, syncRoomState)
      room.off(RoomEvent.LocalTrackPublished, syncRoomState)
      room.off(RoomEvent.ParticipantAttributesChanged, syncRoomState)
      room.off(RoomEvent.ParticipantDisconnected, handleLeavingHost)
    }
  }, [room])

  // Stop recording when disconnect
  useEffect(() => {
    room?.on(RoomEvent.Disconnected, stopRecording)

    return () => {
      room?.off(RoomEvent.Disconnected, stopRecording)
    }
  }, [room, stopRecording])

  // Stop recording before unload
  useEffect(() => {
    function handleBeforeUnload() {
      stopRecording()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [stopRecording])

  return (
    <StateContext.Provider
      value={{
        screen,
        record,
        isHost,
        startRecording,
        stopRecording,
        startActiveScreen,
        stopActiveScreen,
        recordData,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}
