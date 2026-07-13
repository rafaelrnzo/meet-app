import type { RoomMetadata } from '@/feat/rooms/dto'
import type { PollingMessage, PollingOption } from '@/components/PollingCard'
import { useEffect, useState, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useLocalParticipant, useParticipants, useRoomContext } from '@livekit/components-react'
import { generateRoomId } from '@/lib/utils'
import { updateMetadataPolling } from '@/lib/api/admin-api'
import { useParamsState } from '@/hooks/use-params-state'
import { useDataChannel } from '@/hooks/use-data-channel'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction, ParticipantAttribute, ScreenCode } from '@/feat/enum'
import { defaultErrorMessage } from '@/config'
import { toast } from '@/components/ui/sonner'

interface VoteMessage {
  optionId: number
  id: string
  identity: string
  name: string
}

export function usePollingSession(onReady?: () => void) {
  const { screen, stopActiveScreen } = useRoomState()
  const { openPanelOpen, closePanel } = useParamsState()
  const [loading, setLoading] = useState(false)
  const parsed = JSON.parse(screen?.polling ?? '') as PollingMessage[]
  const pollings = { ...parsed.find((polling) => !polling.closedAt) }
  const {
    id,
    openedAt = -1,
    totalParticipant = 0,
    question = '',
    options = [],
    identity,
  } = pollings
  const room = useRoomContext()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const userRole = localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()]

  const { send: updateVote } = useDataChannel<VoteMessage>(
    LiveKitAction.PollingVoteNow,
    ({ payload }) => listenVote(payload)
  )

  const prepareToAnswer = useEffectEvent(() => {
    onReady?.()
    closePanel()
  })

  function listenVote(payload?: VoteMessage) {
    const prev = room.localParticipant.attributes[ParticipantAttribute.ScreenActivePolling]
    if (!prev || !payload) return

    const prevMessages = JSON.parse(prev) as PollingMessage[]
    const newMessages = prevMessages.map((message) => {
      if (message.id !== payload.id) return message

      return {
        ...message,
        options: message.options.map((option) =>
          option.id === payload.optionId
            ? {
                ...option,
                votes: [
                  ...option.votes.filter((vote) => vote.identity !== payload.identity),
                  {
                    identity: payload.identity,
                    name: payload.name,
                  },
                ],
              }
            : {
                ...option,
                votes: option.votes.filter((vote) => vote.identity !== payload.identity),
              }
        ),
      }
    })

    room.localParticipant.setAttributes({
      [ParticipantAttribute.ScreenActivePolling]: JSON.stringify(
        newMessages.map((message) => ({
          ...message,
          totalParticipant: message.options.reduce((acc, value) => acc + value.votes.length, 0),
        }))
      ),
    })
  }

  function selectVote(optionId: number) {
    if (!screen || !id) {
      return
    }

    updateVote(
      {
        optionId,
        id,
        identity: room.localParticipant.identity,
        name: room.localParticipant.name ?? '',
      },
      { reliable: true, destinationIdentities: [screen.host] }
    )
  }

  function findVote() {
    return options.find((opt) =>
      opt.votes.some((vote) => vote.identity === room.localParticipant.identity)
    )?.id
  }

  async function endPolling() {
    const prev = participants.find((user) => user.identity === identity)?.attributes[
      ParticipantAttribute.ScreenActivePolling
    ]
    if (!prev || !room.metadata) return

    setLoading(true)

    try {
      const roomMetadata: RoomMetadata = JSON.parse(room.metadata)
      const localPolling: PollingMessage[] = JSON.parse(prev)
      const updatedLocalPolling = localPolling.map((message) =>
        message.identity === identity ? { ...message, closedAt: Date.now() } : message
      )

      await updateMetadataPolling({
        room_id: roomMetadata.room_id,
        polling: [...roomMetadata.polling, ...updatedLocalPolling],
      })

      openPanelOpen()
      stopActiveScreen()
    } catch (error) {
      toast.error('Gagal menutup jajak pendapat', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => prepareToAnswer(), [])
  return {
    identity,
    totalParticipant,
    openedAt,
    question,
    options,
    isHost: ['admin', 'moderator'].includes(userRole),
    loading,
    selectVote,
    findVote,
    endPolling,
  }
}

export function usePollingQuestion(config?: { optionLength?: number }) {
  const room = useRoomContext()
  const { optionLength = 2 } = { ...config }
  const { screen, startActiveScreen } = useRoomState()
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<PollingMessage[]>([])
  const [collapse, setCollapse] = useState(false)
  const [options, setOptions] = useState<PollingOption[]>(
    Array.from({ length: optionLength }, (_, index) => index + 1).map((id) => ({
      id,
      value: '',
      votes: [],
    }))
  )

  const uniqueValues = new Set()
  const disabled =
    !question.trim() ||
    options.filter((option) => !!option.value.trim()).length < 2 ||
    options
      .filter((option) => !!option.value.trim())
      .some((opt) => {
        const val = opt.value.trim().toLowerCase()
        if (uniqueValues.has(val)) return true
        uniqueValues.add(val)
        return false
      })

  function startPolling() {
    const participant = room.localParticipant
    const prev = participant.attributes[ParticipantAttribute.ScreenActivePolling] || '[]'

    try {
      const prevMessage: PollingMessage[] = JSON.parse(prev)
      const payload: PollingMessage = {
        id: `${generateRoomId()}-${Date.now()}`,
        identity: room.localParticipant.identity,
        totalParticipant: 0,
        question,
        openedAt: Date.now(),
        closedAt: null,
        options: [
          ...options.filter((option) => !!option.value),
          { id: -1, value: 'Lewati pendapat', votes: [] },
        ],
      }

      const broadcast = startActiveScreen(ScreenCode.Polling, {
        polling: JSON.stringify([...prevMessage, payload]),
      })

      broadcast.then(() => {
        setQuestion('')
        setOptions((prev) => prev.map((previous) => ({ ...previous, value: '', votes: [] })))
        setCollapse(history.length > 0)
      })

      toast.success('Jajak pendapat berhasil dibuat', {
        description: `Jajak pendapat “${question}” berhasil dibuat`,
      })
    } catch (error) {
      toast.error('Gagal membuat jajak pendapat', {
        description: error instanceof Error ? error.message : defaultErrorMessage,
      })
    }
  }

  useEffect(() => {
    function updateHistory(metadata: string) {
      try {
        const { polling }: { polling: PollingMessage[] } = JSON.parse(metadata)
        setHistory(polling)
        setCollapse((prev) => (!prev ? !!polling.length : prev))
      } catch (e) {
        console.log('Failed to update metadata:', e)
      }
    }

    function getHistory() {
      if (!room.metadata) return

      try {
        const { polling }: { polling: PollingMessage[] } = JSON.parse(room.metadata)
        setHistory(polling)
        setCollapse((prev) => (!prev ? !!polling.length : prev))
      } catch (e) {
        console.log('Failed to get metadata:', e)
      }
    }

    room
      .on(RoomEvent.Connected, getHistory)
      .on(RoomEvent.Reconnected, getHistory)
      .on(RoomEvent.RoomMetadataChanged, updateHistory)
    return () => {
      room
        .off(RoomEvent.Connected, getHistory)
        .off(RoomEvent.Reconnected, getHistory)
        .off(RoomEvent.RoomMetadataChanged, updateHistory)
    }
  }, [room])

  return {
    allowNewPolling: !screen,
    collapse,
    options,
    question,
    history,
    disabled,
    setQuestion,
    setOptions,
    startPolling,
    toggleCollapse: () => setCollapse((prev) => !prev),
  }
}
