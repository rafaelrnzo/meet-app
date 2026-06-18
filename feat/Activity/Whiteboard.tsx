'use client'

import type { FC } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useWhiteboard } from '@/hooks/crdt/use-whiteboard'

// eslint-disable-next-line import/no-unresolved
import '@excalidraw/excalidraw/index.css'

export const Whiteboard: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { excalidrawRef, binding, initialData, setApi } = useWhiteboard(onReady)

  return (
    <div ref={excalidrawRef} className='absolute inset-0'>
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
  )
}
