import type { PollingMessage, PollingOption } from '@/components/PollingCard'
import { useEffect, useState, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { generateRoomId } from '@/lib/utils'
import { useParamsState } from '@/hooks/use-params-state'
import { useDataChannel } from '@/hooks/use-data-channel'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction, ParticipantAttribute, ScreenCode } from '@/feat/enum'
import { updateRoomMetadata } from '@/example-api'

interface VoteMessage {
  optionId: number
  id: string
  identity: string
  name: string
}

export function usePollingSession(onReady?: () => void) {
  const { screen, isHost, stopActiveScreen } = useRoomState()
  const { openPanelOpen, closePanel } = useParamsState()
  const [loading, setLoading] = useState(false)
  const parsed = JSON.parse(screen?.polling ?? '') as PollingMessage[]
  const pollings = { ...parsed.find((polling) => !polling.closedAt) }
  const { id, openedAt = -1, totalParticipant = 100, question = '', options = [] } = pollings
  const room = useRoomContext()

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
      [ParticipantAttribute.ScreenActivePolling]: JSON.stringify(newMessages),
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

  async function endPolling() {
    const prev = room.localParticipant.attributes[ParticipantAttribute.ScreenActivePolling]
    if (!prev || !room.metadata) return

    setLoading(true)

    try {
      const roomMetadata: { polling: PollingMessage[] } = JSON.parse(room.metadata)
      const localPolling: PollingMessage[] = JSON.parse(prev)
      const updatedLocalPolling = localPolling.map((message) =>
        message.identity === room.localParticipant.identity
          ? { ...message, closedAt: Date.now() }
          : message
      )

      const { error } = await updateRoomMetadata(room.name, {
        polling: [...roomMetadata.polling, ...updatedLocalPolling],
      })

      if (error) {
        throw error
      }

      openPanelOpen()
      stopActiveScreen()
    } catch (e) {
      console.log('Failed to end polling:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => prepareToAnswer(), [])
  return { totalParticipant, openedAt, question, options, isHost, loading, selectVote, endPolling }
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

  const disabled =
    !question.trim() ||
    options.filter((option) => !!option.value.trim()).length < 2 ||
    options
      .filter((option) => !!option.value.trim())
      .reduce(
        (acc, opt) => {
          if (opt.value.trim().toLowerCase() === acc.text.toLowerCase()) {
            acc.dup = true
          } else {
            acc.text = opt.value.trim().toLowerCase()
          }

          return acc
        },
        { text: '', dup: false }
      ).dup

  function startPolling(totalParticipant: number) {
    const participant = room.localParticipant
    const prev = participant.attributes[ParticipantAttribute.ScreenActivePolling] || '[]'

    try {
      const prevMessage: PollingMessage[] = JSON.parse(prev)
      const payload: PollingMessage = {
        id: `${generateRoomId()}-${Date.now()}`,
        identity: room.localParticipant.identity,
        totalParticipant,
        question,
        openedAt: Date.now(),
        closedAt: null,
        options: [
          ...options.filter((option) => !!option.value),
          { id: -2, value: 'Tidak menjawab', votes: [] },
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
    } catch (e) {
      console.log('Failed to start polling:', e)
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

    getHistory()
    room.addListener(RoomEvent.RoomMetadataChanged, updateHistory)
    return () => {
      room.removeListener(RoomEvent.RoomMetadataChanged, updateHistory)
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
