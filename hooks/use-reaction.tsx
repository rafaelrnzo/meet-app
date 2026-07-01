import { useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { useDataChannel } from '@/hooks/use-data-channel'
import { LiveKitAction } from '@/feat/enum'

interface Reaction {
  id: string
  emoji: string
  senderName: string
  x: number
}

export const useReaction = () => {
  const { localParticipant } = useLocalParticipant()
  const [reactions, setReactions] = useState<Reaction[]>([])

  const addReaction = ({ id, emoji, senderName, x }: Reaction) => {
    setReactions((prev) => [
      ...prev,
      {
        id,
        emoji,
        x,
        senderName,
      },
    ])
    setTimeout(() => setReactions((prev) => prev.filter((react) => react.id !== id)), 4000)
  }

  const { send } = useDataChannel<string>(LiveKitAction.Reaction, ({ payload, participant }) => {
    const id = `${Date.now()}-${Math.random()}`
    const x = 10 + Math.random() * 80
    if (!payload || !participant) return
    addReaction({ id, emoji: payload, senderName: participant?.name ?? 'unknown', x })
  })

  const sendReaction = (emoji: string) => {
    if (!localParticipant) return
    const id = `${Date.now()}-${Math.random()}`
    const x = 10 + Math.random() * 80
    addReaction({ id, emoji, senderName: 'You', x })

    send(emoji, { reliable: false })
  }

  return { sendReaction, reactions }
}
