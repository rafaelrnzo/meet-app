'use client'

import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn, djs } from '@/lib/utils'
import { formatCountdown } from '@/feat/helpers'

export interface PollingCardProps {
  loading?: boolean
  openedAt: number
  withTimer?: boolean
  question: string
  options: PollingOption[]
  totalParticipant: number
  isResult?: boolean
  onCheckedChange?: (id: number) => void
  onClosePolling?: () => void
}

export interface PollingOption {
  id: number
  value: string
  votes: { identity: string; name: string }[]
}

export interface PollingMessage {
  id: string
  openedAt: number
  closedAt: number | null
  identity: string
  question: string
  options: PollingOption[]
  totalParticipant: number
}

const TIMER_IN_MS = 60 * 3 // 3 min

const ACTION_CLASSES = cn(
  'text-destructive mt-3 inline-flex size-auto h-11 not-disabled:cursor-pointer items-center justify-center rounded-md text-center font-semibold',
  'hover:not-disabled:bg-red-300 bg-red-200 disabled:opacity-40'
)

export const PollingCard: FC<PollingCardProps> = ({
  question,
  options,
  openedAt,
  totalParticipant,
  isResult = false,
  withTimer = false,
  loading = false,
  onCheckedChange,
  onClosePolling,
}) => {
  const [checkedId, setCheckedId] = useState(0)
  const [feedback, setFeedback] = useState(false)
  const [counter, setCounter] = useState(withTimer ? TIMER_IN_MS : -1)
  const Label = isResult ? 'p' : 'label'
  const onClosePollingRef = useRef(onClosePolling)
  const answers = isResult ? options : options.filter((option) => option.id !== -2)
  const votesLength = answers.reduce((acc, ans) => acc + ans.votes.length, 0)

  useEffect(() => {
    if (!isResult || !withTimer) return

    const timer = setInterval(() => {
      setCounter((prev) => {
        if (!(prev - 1)) {
          clearInterval(timer)
        }

        return prev - 1
      })
    }, 1_000)

    return () => {
      clearInterval(timer)
    }
  }, [isResult, withTimer])

  useEffect(() => {
    if (!counter) {
      onClosePollingRef.current?.()
    }
  }, [counter])

  // INI NGIDE AJA WKWK, BIAR USERNYA GA BINGUNG KRN GADA DI FIGMA
  if (feedback) {
    return (
      <div className='text-foreground bg-background mt-4 flex w-full flex-col gap-4 rounded-md border p-5 shadow'>
        <p>Pendapat sudah direkam. Admin segera memproses pendapat Anda.</p>
        <button
          className='bg-secondary hover:not-disabled:bg-foreground/14 ml-auto inline-flex h-9 items-center rounded-md border px-3 text-sm shadow'
          onClick={() => setFeedback(false)}
        >
          Ubah
        </button>
      </div>
    )
  }

  return (
    <div className='text-foreground bg-background mt-4 flex w-full flex-col gap-4 rounded-md border p-5 shadow'>
      <h3 className='text-primary font-semibold'>{question}</h3>
      {isResult && (
        <div className='flex w-full flex-wrap items-center gap-2 text-xs leading-4'>
          <svg xmlns='http://www.w3.org/2000/svg' width={16} height={16} fill='none'>
            <path
              fill='#A3A3A3'
              d='M4.6.593a.589.589 0 0 0-.176-.42.604.604 0 0 0-.848 0 .589.589 0 0 0-.176.42V1.84c-1.152.09-1.907.314-2.462.863-.556.548-.782 1.295-.875 2.432h15.874c-.093-1.138-.319-1.884-.875-2.432-.555-.55-1.31-.772-2.462-.864V.593a.589.589 0 0 0-.176-.42.604.604 0 0 0-.848 0 .589.589 0 0 0-.176.42v1.195c-.532-.01-1.129-.01-1.8-.01H6.4c-.671 0-1.268 0-1.8.01V.593Z'
            />
            <path
              fill='#A3A3A3'
              fillRule='evenodd'
              d='M0 8.099c0-.663 0-1.253.01-1.778h15.98c.01.525.01 1.115.01 1.778v1.58c0 2.98 0 4.47-.938 5.395-.937.925-2.445.926-5.462.926H6.4c-3.017 0-4.526 0-5.462-.926C0 14.148 0 12.659 0 9.679v-1.58Zm12 1.58a.805.805 0 0 0 .566-.231.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.118c.15.148.354.231.566.231Zm0 3.16a.805.805 0 0 0 .566-.23.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.117c.15.148.354.231.566.231ZM8.8 8.89c0 .21-.084.41-.234.559a.805.805 0 0 1-1.132 0 .785.785 0 0 1 0-1.118.805.805 0 0 1 1.132 0c.15.148.234.35.234.559Zm0 3.16c0 .21-.084.41-.234.56a.805.805 0 0 1-1.132 0 .785.785 0 0 1 0-1.118.805.805 0 0 1 1.132 0c.15.148.234.349.234.558ZM4 9.68a.805.805 0 0 0 .566-.231.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.118c.15.148.354.231.566.231Zm0 3.16a.805.805 0 0 0 .566-.23.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.117c.15.148.354.231.566.231Z'
              clipRule='evenodd'
            />
          </svg>
          <time dateTime={djs(openedAt).toString()} className='mr-auto translate-y-px'>
            {djs(openedAt).format('DD MMMM YYYY, HH.mm WIB')}
          </time>
          <p className='flex items-center gap-2'>
            <svg xmlns='http://www.w3.org/2000/svg' width={15} height={16} fill='none'>
              <path
                fill='#A3A3A3'
                d='M4.019 9.132v5.604A1.264 1.264 0 0 1 2.756 16H1.27A1.262 1.262 0 0 1 0 14.736V9.132a1.264 1.264 0 0 1 1.271-1.271h1.485a1.263 1.263 0 0 1 1.263 1.271Zm5.494-7.86v13.464A1.264 1.264 0 0 1 8.243 16H6.757a1.271 1.271 0 0 1-1.271-1.264V1.272A1.28 1.28 0 0 1 6.757 0h1.485a1.27 1.27 0 0 1 1.271 1.272ZM15 5.522v9.214A1.264 1.264 0 0 1 13.737 16h-1.484a1.262 1.262 0 0 1-1.272-1.264V5.522a1.272 1.272 0 0 1 1.272-1.272h1.517A1.27 1.27 0 0 1 15 5.522Z'
                style={{
                  fill: '#a3a3a3',
                  fillOpacity: 1,
                }}
              />
            </svg>
            <span className='translate-y-0.5'>
              {votesLength}/{totalParticipant}
            </span>
          </p>
        </div>
      )}
      <ul className='flex flex-col gap-2'>
        {answers.map(({ id, value, votes }) => (
          <li key={id} className='flex flex-col'>
            {!isResult && id === -1 ? (
              <button
                disabled={checkedId === id}
                className={cn(ACTION_CLASSES)}
                onClick={() => {
                  onCheckedChange?.(-1)
                  setCheckedId(-1)
                  setFeedback(true)
                }}
              >
                Lewati Pendapat {checkedId === id ? '(dilewati)' : ''}
              </button>
            ) : (
              <Label
                htmlFor={isResult ? void 0 : `answer-option-${id}`}
                className={cn(
                  'flex items-center hover:not-disabled:cursor-pointer',
                  !isResult && (checkedId === id ? 'bg-primary text-primary-foreground' : 'hover:not-disabled:border-primary hover:not-disabled:text-primary'), // prettier-ignore
                  !isResult ? 'gap-4 rounded-md border p-5' : 'gap-2'
                )}
              >
                {!isResult && (
                  <input
                    type='radio'
                    id={`answer-option-${id}`}
                    name={`answer-option-${id}`}
                    checked={checkedId === id}
                    onChange={() => {
                      onCheckedChange?.(id)
                      setCheckedId(id)
                      setFeedback(true)
                    }}
                  />
                )}
                <span className={cn('text-sm', !isResult && 'font-semibold')}>{value}</span>
              </Label>
            )}
            {isResult && (
              <div className='flex items-center gap-2'>
                <div className='relative h-2 grow'>
                  <span className='bg-foreground/10 absolute inset-0 rounded-full'></span>
                  <span
                    style={{
                      width: `${((id > -2 ? votes.length : totalParticipant - votesLength) / totalParticipant) * 100}%`,
                    }}
                    className={cn(
                      'absolute top-0 bottom-0 left-0 rounded-full',
                      id < 0 ? 'bg-destructive' : 'bg-primary'
                    )}
                  ></span>
                </div>
                <span className='block min-w-3 text-right text-sm'>{`${id > -2 ? votes.length : totalParticipant - votesLength}`}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      {isResult && onClosePolling && (
        <button disabled={loading} onClick={() => onClosePolling()} className={cn(ACTION_CLASSES)}>
          {loading ? (
            'Menutup pendapat...'
          ) : (
            <>Tutup Pendapat {counter >= 0 ? `(${formatCountdown(counter)})` : ''}</>
          )}
        </button>
      )}
    </div>
  )
}
