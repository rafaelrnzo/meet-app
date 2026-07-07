'use client'

import { SmileyIcon } from '@phosphor-icons/react'
import { useReaction } from '@/hooks/use-reaction'
import { ButtonIcon } from '@/components/Button'

export const ReactionIcon = ({ isOpen, onClick }: { isOpen: boolean; onClick?: () => void }) => {
  const { sendReaction, truncateName, reactions, reactionElementRef } = useReaction()

  return (
    <div className='relative'>
      <ButtonIcon isActive={!isOpen} className='relative' onClick={onClick}>
        <SmileyIcon weight='fill' size={24} />
      </ButtonIcon>
      {isOpen && (
        <div className='absolute -top-[calc(100%+48px)] left-[calc(50%-40px)] flex -translate-x-1/2 gap-4 rounded-full border border-neutral-400 bg-white p-2 shadow-xl xl:-top-[calc(100%+67px)]'>
          {['💖', '👍', '🎉', '👏', '😂', '😮'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className='size-8 cursor-pointer text-2xl'
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div
        ref={reactionElementRef}
        className='pointer-events-none fixed inset-0 top-3 left-3 overflow-hidden'
      >
        {reactions.map(({ id, emoji, senderName, x }) => (
          <div
            key={id}
            className='absolute bottom-20 flex animate-[floatUpAndFade_4s_ease-out_forwards] flex-col items-center justify-center text-center opacity-0'
            style={{
              left: `${x}%`,
            }}
          >
            <span className='mb-6 h-5.25 text-[32px]'>{emoji}</span>
            <small className='line-clamp-1 w-full rounded-lg bg-red-50 p-1 text-center wrap-break-word text-red-800'>
              {truncateName(senderName, 20)}
            </small>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes floatUpAndFade {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          5% {
            transform: translateY(-5vh) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-75vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
