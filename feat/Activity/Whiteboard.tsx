'use client'

import type { FC } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useWhiteboard } from '@/hooks/crdt/use-whiteboard'
// eslint-disable-next-line import/no-unresolved
import '@excalidraw/excalidraw/index.css'
import { useTabsMeeting } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { Button } from '@/components/ui/button'

export const Whiteboard: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { excalidrawRef, binding, initialData, setApi } = useWhiteboard(onReady)
  const { stopActiveScreen } = useRoomState()
  const { isHostScreen } = useTabsMeeting()

  return (
    <div ref={excalidrawRef} className='absolute inset-0 bg-white'>
      <div className='flex w-full items-center rounded-md border border-neutral-200 bg-white px-5 py-3'>
        <Button variant='destructive' onClick={() => stopActiveScreen()} disabled={!isHostScreen}>
          Berhenti
        </Button>
      </div>
      <div className='absolute inset-0 inset-bs-11 my-10'>
        <Excalidraw
          initialData={{
            ...initialData,
          }} // Need to set the initial data
          excalidrawAPI={setApi}
          onPointerUpdate={binding?.onPointerUpdate}
          theme='light'
          UIOptions={{ tools: { image: false } }}
        />
      </div>
    </div>
  )
}
