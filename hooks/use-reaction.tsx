import { useEffect, useRef, useState } from 'react'
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
  const reactionElementRef = useRef<HTMLDivElement | null>(null)

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

  const truncateName = (name: string, length: number) => {
    return name.length > length ? name.slice(0, length) + '...' : name
  }

  // Imperative - Not possible through declarative state
  useEffect(() => {
    const gridWrapper = document.querySelector<HTMLElement>('.lk-grid-layout-wrapper')
    if (!gridWrapper || !reactionElementRef.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const [{ inlineSize, blockSize }] = entry.borderBoxSize
        const reactionElement = reactionElementRef.current

        if (reactionElement) {
          reactionElement.style.width = inlineSize + 'px'
          reactionElement.style.height = blockSize + 'px'
        } else {
          observer.unobserve(entry.target)
        }
      })
    })

    observer.observe(gridWrapper)
    return () => {
      observer.disconnect()
    }
  }, [])

  return { truncateName, sendReaction, reactions, reactionElementRef }
}
