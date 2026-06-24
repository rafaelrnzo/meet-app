import type { FC } from 'react'
import { HandFistIcon, HandIcon } from '@phosphor-icons/react'
import { useHandRaises } from '@/hooks'
import { Button, ButtonIcon } from '@/components/Button'

export const HandRaiseDialog: FC = () => {
  const { raisedHands, lowerHand } = useHandRaises()

  if (!raisedHands.size) {
    return null
  }

  return (
    <div className='fixed bottom-20 left-6 z-50 flex max-h-70 w-64 flex-col rounded-xl border border-neutral-700 bg-neutral-800 p-3 shadow-2xl'>
      <div className='flex items-center gap-2 border-b border-neutral-700 pb-2 text-sm font-medium text-neutral-300'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-amber-950 text-amber-400'>
          <HandIcon size={14} weight='fill' />
        </div>
        <span>Angkat tangan</span>
        <span className='ml-auto rounded-full bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-400'>
          {raisedHands.size}
        </span>
      </div>
      <div className='mt-2 flex flex-col gap-0.5 overflow-y-auto pr-1'>
        {Array.from(raisedHands.values()).map((user) => (
          <div
            key={user.identity}
            className='flex items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-sm text-neutral-300'
          >
            <p className='flex items-center gap-2.5'>
              <HandIcon size={16} weight='fill' className='shrink-0 text-amber-500' />
              <span className='truncate font-medium'>{user.isMe ? `Kamu` : user.name}</span>
            </p>
            {!user.isMe && (
              <Button className='p-1 px-2 text-xs' onClick={() => lowerHand(user.identity)}>
                Turunkan
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export const HandRaisedIcon: FC = () => {
  const { isRaised, toggleHand } = useHandRaises()

  return (
    <ButtonIcon isActive={isRaised} onClick={toggleHand}>
      {isRaised ? <HandFistIcon weight='fill' size={20} /> : <HandIcon weight='fill' size={20} />}
    </ButtonIcon>
  )
}
