import type * as Y from 'yjs'
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types'
import type { AwarenessState } from '@/lib/livekit-yjs-provider'
import { useRef, useEffect, useState, useMemo } from 'react'
import { ExcalidrawBinding, yjsToExcalidraw } from '@mizuka-wu/y-excalidraw'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'
import { useRoomState } from '@/feat/Room'

export function useWhiteboard(onReady?: () => void) {
  const { ydoc } = useRoomState()
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const yElements = ydoc?.getArray<Y.Map<unknown>>('elements')
  const bindingRef = useRef<ExcalidrawBinding | null>(null)

  // Memo required due to module ydoc is deferred.
  const provider = useMemo(
    () => (!ydoc || !room ? null : new LiveKitYjsProvider(ydoc, room)),
    [room, ydoc]
  )

  useEffect(() => {
    if (!api || !provider || !yElements) return

    const { name } = provider.awareness.getLocalState() as AwarenessState

    provider.awareness.setLocalStateField('user', { name })
    const excalidrawApi = new ExcalidrawBinding(yElements, null, api, provider.awareness)

    bindingRef.current = excalidrawApi
    onReadyRef.current?.()

    return () => {
      excalidrawApi.destroy()
      provider.destroy()
    }
  }, [api, provider, yElements])

  return {
    binding: bindingRef.current,
    setApi,
    excalidrawRef,
    initialData: {
      appState: {
        activeTool: {
          type: 'freedraw',
          locked: false,
          customType: null,
          lastActiveTool: {
            type: 'freedraw',
            customType: null,
          },
        },
      },
      elements: yElements ? yjsToExcalidraw(yElements) : null,
    } satisfies ExcalidrawProps['initialData'],
  }
}
