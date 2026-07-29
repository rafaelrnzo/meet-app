import type { ExcalidrawImperativeAPI, ExcalidrawProps } from '@excalidraw/excalidraw/types'
import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { RoomEvent } from 'livekit-client'
import { ExcalidrawBinding, yjsToExcalidraw } from '@mizuka-wu/y-excalidraw'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'

export function useWhiteboard(onReady?: () => void) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [binding, setBinding] = useState<ExcalidrawBinding | null>(null)
  const excalidrawRef = useRef<HTMLDivElement | null>(null)
  const room = useRoomContext()

  // Keep the callback fresh without re-triggering the sync effect.
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    if (!api || !room) return

    const ydoc = new Y.Doc()
    const yElements = ydoc.getArray<Y.Map<unknown>>('elements')
    const provider = new LiveKitYjsProvider(ydoc, room)
    const excalidrawBinding = new ExcalidrawBinding(yElements, null, api, provider.awareness)

    // Name is not ready yet when livekit connecting state
    const onConnectedEvent = () => {
      provider.awareness.setLocalStateField('user', { name: room.localParticipant.name ?? '' })
    }

    // If we're joining a room where a board already exists, the Y.Doc sync
    // (LiveKitYjsProvider's constructor) will pull it in shortly after this
    // runs. `initialData` can't be used for that because Excalidraw only
    // reads it once, at mount, before any sync has happened — so instead we
    // push whatever's already in the doc via updateScene once it's synced.
    const applyExisting = () => {
      const elements = yjsToExcalidraw(yElements)
      if (elements.length) api.updateScene({ elements })
    }

    // Elements arriving from the initial doc sync trigger Yjs 'update' events
    // on yElements via the binding; give it a beat then apply once up front
    // in case the sync already landed before the binding was attached.
    applyExisting()
    setBinding(excalidrawBinding)

    onReadyRef.current?.()
    room.on(RoomEvent.Connected, onConnectedEvent)

    return () => {
      excalidrawBinding.destroy()
      provider.destroy()

      setBinding(null)
      room.off(RoomEvent.Connected, onConnectedEvent)
    }
  }, [api, room])

  return {
    binding,
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
    } satisfies ExcalidrawProps['initialData'],
  }
}
