import type { RaisedHandUser } from '@/hooks/use-hand-raises'
import { useEffect, useRef, useCallback } from 'react'
import { HandFistIcon, HandIcon } from '@phosphor-icons/react'
import { useLocalParticipant } from '@livekit/components-react'
import { toast } from './ui/sonner'
import { useHandRaises } from '@/hooks'
import { ParticipantAttribute } from '@/feat/enum'
import { ButtonIcon } from '@/components/Button'

export const HandRaiseToast = () => {
  const { raisedHands } = useHandRaises()
  const toastIdRef = useRef<string | number | null>(null)
  const prevRaisedHandsRef = useRef<Map<string, RaisedHandUser>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { localParticipant } = useLocalParticipant()
  const roleAttribute = localParticipant?.attributes?.[ParticipantAttribute.RoleName.toLowerCase()]

  useEffect(() => {
    audioRef.current = new Audio('/raise_hand.mp3')
  }, [])

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => {
        console.warn(err)
      })
    }
  }, [])

  const dismissToast = useCallback(() => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [])

  useEffect(() => {
    const list = Array.from(raisedHands.values())
    const count = list.length
    const prevMap = prevRaisedHandsRef.current
    const isCurrentUserHost = ['admin', 'moderator'].includes(roleAttribute || '')

    const checkShowAsHost = (userRole: string) => {
      const isTargetHost = ['admin', 'moderator'].includes(userRole)
      return isTargetHost && !isCurrentUserHost
    }

    const currentIds = Array.from(raisedHands.keys())
    const prevIds = Array.from(prevMap.keys())

    const hasNewRaise = currentIds.some((id) => !prevMap.has(id))
    const hasLowered = prevIds.some((id) => !raisedHands.has(id))

    if (count === prevMap.size && !hasNewRaise && !hasLowered) {
      return
    }

    if (hasLowered) {
      const loweredUser = Array.from(prevMap.values()).find(
        (user) => !raisedHands.has(user.identity)
      )

      if (loweredUser) {
        const lowerMessage = loweredUser.isMe
          ? 'Kamu menurunkan tangan'
          : `${checkShowAsHost(loweredUser.roleName) ? 'Host' : loweredUser.name} menurunkan tangan`

        toastIdRef.current = toast.raise(lowerMessage, {
          duration: 1000,
          position: 'top-center',
          id: 'hand-toast-id',
        })

        prevRaisedHandsRef.current = new Map(raisedHands)
        return
      }
    }

    if (hasNewRaise) {
      playSound()
    }

    prevRaisedHandsRef.current = new Map(raisedHands)

    if (count === 0) {
      dismissToast()
      return
    }

    let message = ''
    if (count === 1) {
      const activeUser = list[0]
      message = activeUser.isMe
        ? 'Kamu mengangkat tangan'
        : `${checkShowAsHost(activeUser.roleName) ? 'Host' : activeUser.name} mengangkat tangan`
    } else {
      message = `${count} orang mengangkat tangan`
    }

    toastIdRef.current = toast.raise(message, {
      duration: 2500,
      position: 'top-center',
      id: 'hand-toast-id',
    })
  }, [raisedHands, roleAttribute, dismissToast, playSound])

  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  return null
}

export const HandRaisedIcon = () => {
  const { isRaised, toggleHand } = useHandRaises()

  return (
    <ButtonIcon isActive={isRaised} onClick={toggleHand}>
      <HandIcon weight='fill' size={20} />
    </ButtonIcon>
  )
}
