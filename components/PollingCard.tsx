'use client'

import type { FC } from 'react'
import { cn, djs } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export interface PollingCardProps {
  loading?: boolean
  openedAt: number
  question: string
  options: PollingOption[]
  totalParticipant: number
  isResult?: boolean
  isHistory?: boolean
  checked?: number
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

const ACTION_CLASSES = cn(
  'text-destructive mt-3 inline-flex size-auto h-11 not-disabled:cursor-pointer items-center justify-center rounded-md text-center font-semibold',
  'hover:not-disabled:bg-red-300 bg-red-200 disabled:opacity-40'
)

export const PollingCard: FC<PollingCardProps> = ({
  question,
  options: answers,
  openedAt,
  totalParticipant,
  isResult = false,
  isHistory = false,
  loading = false,
  checked,
  onCheckedChange,
  onClosePolling,
}) => {
  const Label = isResult ? 'p' : 'label'

  return (
    <div className='text-foreground bg-background mt-4 flex w-full flex-col gap-4 rounded-md border p-5 shadow'>
      <h3 className='text-primary font-semibold wrap-anywhere'>{question}</h3>
      {isHistory && (
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
        </div>
      )}
      <ul className='flex flex-col gap-2'>
        {answers.map(({ id, value, votes }) => (
          <RadioGroup
            key={id}
            value={`${checked}`}
            onValueChange={(val) => onCheckedChange?.(Number(val))}
            className='flex flex-col'
          >
            {!isResult && id === -1 ? (
              <button
                disabled={checked === id}
                className={cn(ACTION_CLASSES)}
                onClick={() => onCheckedChange?.(-1)}
              >
                Lewati Pendapat {checked === id ? '(dilewati)' : ''}
              </button>
            ) : (
              <Label
                htmlFor={isResult ? void 0 : `answer-option-${id}`}
                className={cn(
                  'flex items-center hover:not-disabled:cursor-pointer',
                  !isResult && (checked === id ? 'bg-primary text-primary-foreground border-primary' : 'hover:not-disabled:border-primary hover:not-disabled:text-primary '), // prettier-ignore
                  !isResult ? 'gap-4 rounded-md border-2 p-5' : 'gap-2'
                )}
              >
                {!isResult && <RadioGroupItem id={`answer-option-${id}`} value={`${id}`} />}
                <span className={cn('text-sm wrap-anywhere', !isResult && 'font-semibold')}>
                  {value}
                </span>
              </Label>
            )}
            {isResult && (
              <div className='flex items-center gap-2'>
                <div className='relative h-2 grow'>
                  <span className='bg-foreground/10 absolute inset-0 rounded-full'></span>
                  <span
                    style={{
                      width: `${(votes.length / totalParticipant) * 100}%`,
                    }}
                    className={cn(
                      'absolute top-0 bottom-0 left-0 rounded-full',
                      id < 0 ? 'bg-destructive' : 'bg-primary'
                    )}
                  ></span>
                </div>
                <span className='block min-w-3 text-right text-sm'>{votes.length}</span>
              </div>
            )}
          </RadioGroup>
        ))}
      </ul>
      {isResult && onClosePolling && (
        <button disabled={loading} onClick={() => onClosePolling()} className={cn(ACTION_CLASSES)}>
          {loading ? 'Menutup pendapat...' : 'Tutup Pendapat'}
        </button>
      )}
    </div>
  )
}
