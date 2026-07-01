'use client'

import type { ScreenCode } from '@/feat/enum'
import { useState } from 'react'
import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { LiveKitAction, ParticipantAttribute } from '@/feat/enum'

export interface ParticipantAttributes {
  SCREEN_ACTIVE_URL: string
  SCREEN_ACTIVE: string
  SCREEN_ACTIVE_HOST: ScreenCode
  HAND_RAISED: boolean
}

export interface ParticipantList {
  id: string
  name: string
  isMuted: boolean
  isLocal: boolean
  isRaised: boolean
  isModerator?: boolean
  attributes?: ParticipantAttributes
  hide: boolean
}

export interface ParticipantListPending extends Omit<
  ParticipantList,
  'isSpeaking' | 'isMuted' | 'isModerator'
> {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface ParticipantPendingGroup {
  id: string
  headline: string
  hide: boolean
  lists: ParticipantListPending[]
}

export interface ParticipantGroup {
  id: string
  headline: string
  hide: boolean
  lists: ParticipantList[]
}

export function useTabsParticipant() {
  const room = useRoomContext()
  const remoteParticipants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const userRole = localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()]
  const isModerator = ['moderator', 'admin'].includes(userRole)
  const [modalConfirm, setModalConfirm] = useState<{
    id: 'mute-all' | 'dismiss-participant'
    open: boolean
    title?: string
    description?: string
    identity?: string
  }>({ id: 'mute-all', open: false, title: '', description: '', identity: '' })

  const shouldMuteAll = remoteParticipants.some((p) => {
    if (p.identity === localParticipant?.identity) return false
    return p.isMicrophoneEnabled
  })

  const participantGroups: ParticipantGroup[] = [
    {
      id: 'Participants',
      headline: 'Peserta',
      hide: false,
      lists: remoteParticipants
        .sort((a, b) => {
          const isRaised = (v: unknown) => v === true || v === 'true' || v === '1'
          const aRaised = isRaised(a.attributes?.[ParticipantAttribute.HandRaised])
          const bRaised = isRaised(b.attributes?.[ParticipantAttribute.HandRaised])
          const aIsLocal = a.isLocal
          const bIsLocal = b.isLocal

          if (aIsLocal !== bIsLocal) return Number(bIsLocal) - Number(aIsLocal)

          if (aRaised !== bRaised) return Number(bRaised) - Number(aRaised)

          return (a.name ?? '').localeCompare(b.name ?? '')
        })
        .map((participant) => {
          const isMuted = !participant.isMicrophoneEnabled
          const isModerator = ['moderator', 'admin'].includes(
            participant.attributes[ParticipantAttribute.RoleName.toLowerCase()]
          )

          return {
            id: participant.identity,
            name: participant.name ?? '',
            attributes: participant.attributes as unknown as ParticipantAttributes,
            isRaised: participant.attributes?.[ParticipantAttribute.HandRaised] === 'true',
            isModerator: isModerator,
            isLocal: participant.isLocal,
            isMuted,
            hide: false,
          }
        }),
    },
  ]

  // SEND DATA CHANNEL
  const { send: sendbroadcastMicrophoneMuteAll } = useDataChannel<{ enabled: boolean }>(
    LiveKitAction.AllMicrophoneUpdate,
    () => null
  )

  const { send: sendDirectMicrophoneMute } = useDataChannel<{ enabled: boolean }>(
    LiveKitAction.MicrophoneUpdate,
    () => null
  )

  const { send: sendDismissRoom } = useDataChannel<{ disconnect: boolean }>(
    LiveKitAction.DisconnectRoom,
    async () => null
  )

  // HANDLER
  const handleBroadcastMuteAll = async () => {
    const nextState = !shouldMuteAll
    try {
      sendbroadcastMicrophoneMuteAll({ enabled: nextState })
    } catch (error) {
      console.error('Gagal mengirim perintah mic masal:', error)
    } finally {
      setModalConfirm((prev) => ({ ...prev, open: false }))
    }
  }

  const handleParticipantMute = async ({
    identity,
    isLocal = false,
  }: {
    identity: string
    isLocal?: boolean
  }) => {
    if (isLocal) {
      if (!room) return
      await room.localParticipant
        .setMicrophoneEnabled(false)
        .catch((err) => console.error('Gagal mematikan mic lokal:', err))
    }

    sendDirectMicrophoneMute(
      { enabled: false },
      { destinationIdentities: [identity], reliable: true }
    )
  }

  const handleDismissParticipant = (identity: string) => {
    sendDismissRoom({ disconnect: true }, { destinationIdentities: [identity], reliable: true })
    setModalConfirm((prev) => ({ ...prev, open: false }))
  }

  return {
    participantGroups,
    shouldMuteAll,
    isModerator,
    modalConfirm,
    setModalConfirm,
    handleBroadcastMuteAll,
    handleParticipantMute,
    handleDismissParticipant,
  }
}
