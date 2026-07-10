'use client'

import type { FC } from 'react'
import { Chevron } from '@livekit/components-react'
import { cn, djs } from '@/lib/utils'
import { usePollingQuestion } from '@/hooks'
import { PollingCard } from '@/components/PollingCard'
import { ButtonTab } from '@/components/Button'

const POLLING_OPTION_LENGTH = 5

const INPUT_CLASSES = cn(
  'h-9 inline-flex w-full text-sm items-center px-3 rounded-md border border-muted-foreground/40 shadow'
)

export const TabsPolling: FC = () => {
  const {
    allowNewPolling,
    collapse,
    options,
    history,
    question,
    disabled,
    setQuestion,
    setOptions,
    toggleCollapse,
    startPolling,
  } = usePollingQuestion({ optionLength: POLLING_OPTION_LENGTH })

  return (
    <div className='flex flex-col'>
      <h3>
        <button
          className='border-muted-foreground flex h-11 w-full items-center justify-between rounded-md border px-4 text-sm font-semibold disabled:opacity-40'
          onClick={toggleCollapse}
          disabled={!allowNewPolling}
        >
          Buat Pendapat
          <Chevron className={cn(collapse ? 'rotate-90' : '-rotate-90')} />
        </button>
      </h3>
      <div
        className={cn(
          'mt-4 flex flex-col gap-4 transition-opacity transition-discrete duration-300 starting:opacity-0',
          collapse && 'hidden'
        )}
      >
        <input
          type='seach'
          name='polling-question'
          placeholder='Masukkan pertanyaan Pendapat ...'
          className={cn(INPUT_CLASSES)}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onPointerUp={(e) => e.currentTarget.select()}
          autoComplete='off'
        />
        <ul className='flex flex-col gap-2'>
          {options.map(({ id, value }, index) => (
            <li key={id}>
              <input
                type='search'
                autoComplete='off'
                name={`polling-option-${id}`}
                placeholder={`Opsi ${index + 1}`}
                value={value}
                className={cn(INPUT_CLASSES)}
                onPointerUp={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  setOptions((prev) =>
                    prev.map((previous) =>
                      previous.id === id ? { ...previous, value: e.target.value } : previous
                    )
                  )
                }}
              />
            </li>
          ))}
        </ul>
        <ButtonTab
          isActive
          disabled={disabled}
          className='size-auto h-11 font-semibold'
          onClick={() => startPolling()}
        >
          Buat Pendapat
        </ButtonTab>
      </div>
      {!!history.length && (
        <h1 className='mt-8 text-base font-semibold text-neutral-400'>Riwayat Pendapat</h1>
      )}
      {[...history]
        .sort((a, b) => djs(b.openedAt).diff(a.openedAt))
        .filter((hist) => !!hist.closedAt)
        .map((hist) => (
          <PollingCard
            key={hist.id}
            openedAt={hist.openedAt}
            isHistory
            totalParticipant={hist.totalParticipant}
            question={hist.question}
            options={hist.options}
            isResult
          />
        ))}
    </div>
  )
}
