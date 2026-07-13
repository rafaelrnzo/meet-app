'use client'

import type { FC } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { useDataChannel, usePollingSession } from '@/hooks'
import { LiveKitAction } from '@/feat/enum'
import { PollingCard } from '@/components/PollingCard'

export const Polling: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const {
    identity,
    question,
    options,
    openedAt,
    isHost,
    totalParticipant,
    loading,
    selectVote,
    findVote,
    endPolling,
  } = usePollingSession(onReady)
  const { localParticipant } = useLocalParticipant()

  const { send: dataChannelClosePoll } = useDataChannel<string>(LiveKitAction.ClosePolling, () =>
    endPolling()
  )

  const handleClosePolling = () => {
    if (!identity) return
    if (localParticipant.identity !== identity) {
      return dataChannelClosePoll(identity, { reliable: false, destinationIdentities: [identity] })
    }
    endPolling()
  }

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden bg-white'>
      <div className='w-105 max-w-[87.5%]'>
        <PollingCard
          loading={loading}
          openedAt={openedAt}
          totalParticipant={totalParticipant}
          question={question}
          options={options}
          isResult={isHost}
          checked={findVote()}
          onCheckedChange={selectVote}
          onClosePolling={handleClosePolling}
        />
      </div>
    </div>
  )
}
