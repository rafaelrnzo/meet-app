'use client'

import type { FC } from 'react'
import { usePollingSession } from '@/hooks'
import { PollingCard } from '@/components/PollingCard'

export const Polling: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { question, options, openedAt, isHost, totalParticipant, loading, selectVote, endPolling } =
    usePollingSession(onReady)

  return (
    <div className='bg-secondary flex h-full w-full items-center justify-center overflow-hidden'>
      <div className='w-105 max-w-[87.5%]'>
        <PollingCard
          loading={loading}
          openedAt={openedAt}
          withTimer={isHost}
          totalParticipant={totalParticipant}
          question={question}
          options={options}
          isResult={isHost}
          onCheckedChange={selectVote}
          onClosePolling={endPolling}
        />
      </div>
    </div>
  )
}
