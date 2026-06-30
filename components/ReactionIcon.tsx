import { useState } from 'react'
import { SmileyIcon } from '@phosphor-icons/react'
import { ButtonIcon } from '@/components/Button'
import useReaction from '@/hooks/use-reaction'

export default function ReactionIcon() {
  const [isShow, setShow] = useState(false)
  const { sendReaction, reactions } = useReaction()
  const truncateName = (name: string, length: number) => {
    return name.length > length ? name.slice(0, length) + '...' : name
  }

  return (
    <>
      <ButtonIcon
        isActive={!isShow}
        className='relative'
        onClick={() => {
          setShow(!isShow)
        }}
      >
        <SmileyIcon weight='fill' size={24} />
      </ButtonIcon>
      {isShow && (
        <div className='absolute bottom-32 left-1/2 z-50 mb-4 flex -translate-x-1/2 gap-4 rounded-full border border-neutral-400 bg-white p-2 shadow-xl'>
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
      <div className='pointer-events-none absolute inset-0 z-50 overflow-hidden'>
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
          10% {
            transform: translateY(-50px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-500px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}
