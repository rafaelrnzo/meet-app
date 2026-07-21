import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types'
import type { AwarenessState } from '@/lib/livekit-yjs-provider'
import { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import { ExcalidrawBinding, yjsToExcalidraw } from '@mizuka-wu/y-excalidraw'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'

export function useWhiteboard(onReady?: () => void) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const bindingRef = useRef<ExcalidrawBinding | null>(null)
  const yElementRef = useRef<Y.Array<Y.Map<unknown>> | null>(null)

  useEffect(() => {
    if (!api) return

    const ydoc = new Y.Doc()
    const yElements = ydoc?.getArray<Y.Map<unknown>>('elements')
    const provider = new LiveKitYjsProvider(ydoc, room)
    const { name } = provider.awareness.getLocalState() as AwarenessState

    provider.awareness.setLocalStateField('user', { name })
    const excalidrawApi = new ExcalidrawBinding(yElements, null, api, provider.awareness)

    yElementRef.current = yElements
    bindingRef.current = excalidrawApi
    onReadyRef.current?.()

    return () => {
      excalidrawApi.destroy()
      provider.destroy()
    }
  }, [api, room])

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
      elements: yElementRef.current ? yjsToExcalidraw(yElementRef.current) : null,
    } satisfies ExcalidrawProps['initialData'],
  }
}
