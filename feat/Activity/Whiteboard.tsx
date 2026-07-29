'use client'

import type { FC } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { useWhiteboard } from '@/hooks/crdt/use-whiteboard'

// eslint-disable-next-line import/no-unresolved
import '@excalidraw/excalidraw/index.css'

export const Whiteboard: FC<{ hide?: boolean }> = ({ hide }) => {
  const { excalidrawRef, binding, initialData, setApi } = useWhiteboard()

  return (
    <div
      ref={excalidrawRef}
      inert={hide}
      className='h-full w-full inert:hidden [&_UserList]:hidden [&_UserList-Wrapper]:hidden'
    >
      <Excalidraw
        initialData={initialData} // Need to set the initial data
        excalidrawAPI={setApi}
        onPointerUpdate={binding?.onPointerUpdate}
        theme='light'
        UIOptions={{ tools: { image: false } }}
      />
    </div>
  )
}
