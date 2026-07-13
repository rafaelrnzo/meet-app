import type { RoleName } from '@/feat/types'
import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { LiveKitAction, ParticipantAttribute } from '@/feat/enum'

export interface RaisedHandUser {
  identity: string
  name: string
  isMe: boolean
  roleName: RoleName
}

export function useHandRaises() {
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useParticipants()
  const isRaised = localParticipant.attributes?.[ParticipantAttribute.HandRaised] === 'true'

  const setHandStatus = async (shouldRaise: boolean, name?: string) => {
    try {
      await localParticipant.setAttributes({
        [ParticipantAttribute.HandRaised]: String(shouldRaise),
        [ParticipantAttribute.HandLowererName]: name ?? '',
      })
    } catch (e) {
      console.log('Failed to update hand raise attribute:', e)
    }
  }

  const { send: sendLower } = useDataChannel<{ identity: string; name: string }>(
    LiveKitAction.HandRaisedLower,
    ({ participant }) => {
      setHandStatus(false, participant.name)
    }
  )

  const raisedHands = () => {
    const listMap = new Map<string, RaisedHandUser>()
    const uniqueParticipants = Array.from(new Set([localParticipant, ...remoteParticipants]))
    uniqueParticipants.forEach(({ attributes, identity, name = '' }) => {
      if (attributes?.[ParticipantAttribute.HandRaised] === 'true') {
        listMap.set(identity, {
          identity,
          name,
          isMe: identity === localParticipant.identity,
          roleName: attributes[ParticipantAttribute.RoleName.toLowerCase()] as RoleName,
        })
      }
    })

    return listMap
  }

  const toggleHand = () => setHandStatus(!isRaised)
  const lowerHandLocal = () => setHandStatus(false)
  const lowerHand = ({ identity, name }: { identity: string; name: string }) => {
    if (localParticipant) {
      sendLower({ identity, name }, { reliable: false, destinationIdentities: [identity] })
    }
  }

  return {
    isRaised,
    raisedHands: raisedHands(),
    lowerHandLocal,
    lowerHand,
    toggleHand,
  }
}
