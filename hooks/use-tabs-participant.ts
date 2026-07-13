'use client'

import type { ScreenCode } from '@/feat/enum'
import { useState } from 'react'
import {
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  useRoomInfo,
} from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { LiveKitAction, ParticipantAttribute } from '@/feat/enum'
import { moderateParticipant } from '@/feat/api'

export interface ParticipantAttributes {
  SCREEN_ACTIVE_URL: string
  SCREEN_ACTIVE: string
  SCREEN_ACTIVE_HOST: ScreenCode
  HAND_RAISED: boolean
  ROLE_NAME: string
}

export interface ParticipantList {
  id: string
  name: string
  isMuted?: boolean
  isLocal?: boolean
  isRaised?: boolean
  isModerator?: boolean
  attributes?: ParticipantAttributes
  isBanned?: boolean
  hide?: boolean
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

export interface MetadataInfo {
  banned_users: string[]
  banned_users_name: { name: string; identity: string }[]
  room_id: string
}

export function useTabsParticipant() {
  const room = useRoomContext()
  const roomInfo = useRoomInfo()
  const remoteParticipants = useParticipants()
  const { localParticipant } = useLocalParticipant()

  const userRole = localParticipant?.attributes?.[ParticipantAttribute.RoleName.toLowerCase()] ?? ''
  const isModerator = ['moderator', 'admin'].includes(userRole)

  const [modalConfirm, setModalConfirm] = useState<{
    id: 'mute-all' | 'dismiss-participant' | 'banned-participant'
    open: boolean
    title?: string
    description?: string
    identity?: string
  }>({ id: 'mute-all', open: false, title: '', description: '', identity: '' })

  const shouldMuteAll = remoteParticipants.some((p) => {
    if (p.identity === localParticipant?.identity) return false
    return p.isMicrophoneEnabled
  })

  const bannedUserIdentity = (): MetadataInfo => {
    const defaultMetadata = { banned_users: [], banned_users_name: [], room_id: '' }
    if (!roomInfo.metadata) {
      return defaultMetadata
    }

    try {
      return JSON.parse(roomInfo.metadata) satisfies MetadataInfo
    } catch {
      return defaultMetadata
    }
  }
  const bannedIds = bannedUserIdentity().banned_users_name

  const participantGroups: ParticipantGroup[] = [
    {
      id: 'Participants',
      headline: 'Peserta',
      hide: false,
      lists: [
        // 1. List Participant Active
        ...remoteParticipants
          .filter((participant) => !bannedIds.some((b) => b.identity === participant.identity))
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
              participant.attributes[ParticipantAttribute.RoleName.toLowerCase()] ?? ''
            )

            return {
              id: participant.identity,
              name: participant.name ?? '',
              attributes: participant.attributes as any,
              isRaised: participant.attributes?.[ParticipantAttribute.HandRaised] === 'true',
              isModerator,
              isLocal: participant.isLocal,
              isMuted,
              hide: false,
              isBanned: false,
            }
          }),

        // 2. List Participant Banned
        ...bannedIds.map(({ identity, name }) => ({
          id: identity,
          name: name,
          attributes: {} as any,
          isRaised: false,
          isModerator: false,
          isLocal: false,
          isMuted: true,
          hide: false,
          isBanned: true,
        })),
      ],
    },
  ]

  const bannedParticipantLength = participantGroups[0].lists.filter((p) => p.isBanned).length

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

  const { send: sendModerateRoom } = useDataChannel<{ ban: boolean }>(
    LiveKitAction.ModerateRoom,
    async () => null
  )

  // HANDLER ACTION
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

  const handleModerateParticipant = async (identity: string, action: 'ban' | 'unban') => {
    const roomCode = roomInfo.name
    if (!roomCode) {
      console.warn('Room name belum siap atau tidak ditemukan.')
      return
    }

    try {
      sendModerateRoom({ ban: true }, { destinationIdentities: [identity], reliable: true })
      await moderateParticipant(action, { identity, room_code: roomCode })
    } catch (error) {
      console.error(`Gagal melakukan aksi ${action} pada peserta:`, error)
    } finally {
      setModalConfirm((prev) => ({ ...prev, open: false }))
    }
  }

  return {
    participantGroups,
    shouldMuteAll,
    isModerator,
    modalConfirm,
    bannedParticipantLength,
    setModalConfirm,
    handleModerateParticipant,
    handleBroadcastMuteAll,
    handleParticipantMute,
    handleDismissParticipant,
  }
}
