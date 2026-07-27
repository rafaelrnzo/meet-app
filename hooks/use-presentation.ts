import type { pdfjs } from 'react-pdf'
import { useState, useRef, useEffect, useEffectEvent } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { useDataChannel } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'

export function usePresentation(onReady?: () => void) {
  const [{ page, zoom }, setState] = useState({ page: 1, zoom: 1 })
  const { screen, isHost } = useRoomState()
  const [maxPages, setMaxPages] = useState(1)
  const room = useRoomContext()
  const onReadyRef = useRef(onReady)
  const url = screen?.url ?? ''
  const canvasElementRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<typeof pdfjs | null>(null)
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const renderVersion = useRef(0)

  const loadParser = async () => {
    const pdfjs = (await import('react-pdf')).pdfjs

    // Required
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    pdfRef.current = pdfjs

    onReadyRef.current?.()
    return pdfjs
  }

  const { send: syncPresentation } = useDataChannel<number>(
    LiveKitAction.PresentationUpdate,
    ({ payload }) => {
      if (payload) {
        setState((prev) => ({ ...prev, page: payload }))
      }
    }
  )

  const { send: replySnapshot } = useDataChannel<Record<'page' | 'zoom', number>>(
    LiveKitAction.SnapshotReply,
    ({ payload }) => {
      if (payload) {
        setState((prev) => ({ ...prev, page: payload.page }))
      }
    }
  )

  const { send: requestSnapshot } = useDataChannel<string>(
    LiveKitAction.SnapshotRequest,
    ({ payload }) => {
      if (payload) {
        replySnapshot(
          { page, zoom },
          {
            reliable: true,
            destinationIdentities: [payload],
          }
        )
      }
    }
  )

  const snapshot = useEffectEvent((identity: string) => {
    requestSnapshot(room.localParticipant.identity, {
      reliable: true,
      destinationIdentities: [identity],
    })
  })

  const render = useEffectEvent(async (pageNumber: number, url: string, zoomCurrent: number) => {
    const version = ++renderVersion.current
    const canvas = canvasElementRef.current
    if (!canvas) return

    try {
      const parser = await getParser(url)
      if (!parser) return

      // Skip creating the new page if version doesn't sync
      if (version !== renderVersion.current) return
      const page = await parser.getPage(pageNumber)

      // Skip creating the new viewport if version doesn't sync
      if (version !== renderVersion.current) return
      const viewport = page.getViewport({
        scale: 1.5 * zoomCurrent,
      })

      const offScreenCanvas = document.createElement('canvas')
      offScreenCanvas.width = viewport.width
      offScreenCanvas.height = viewport.height

      const offScreenCtx = offScreenCanvas.getContext('2d')
      if (!offScreenCtx) return

      const task = page.render({
        canvas: offScreenCanvas,
        canvasContext: offScreenCtx,
        viewport,
      })

      // Build content
      await task.promise

      // Skip creating the new context if version doesn't sync
      if (version !== renderVersion.current) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      ctx.drawImage(offScreenCanvas, 0, 0)

      if (isHost && !!room.remoteParticipants.size) {
        syncPresentation(pageNumber)
      }
    } finally {
      //
    }
  })

  async function getParser(url: string) {
    if (!docRef.current) {
      if (!url) return null
      if (pdfRef.current) {
        docRef.current = await pdfRef.current.getDocument(url).promise
      } else {
        const pdfjs = await loadParser()
        docRef.current = await pdfjs.getDocument(url).promise
      }
    }

    setMaxPages(docRef.current.numPages)
    return docRef.current
  }

  function pagePrev() {
    setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
  }

  function pageNext() {
    setState((prev) => ({ ...prev, page: Math.min(maxPages, prev.page + 1) }))
  }

  function zoomIn() {
    setState((prev) => ({ ...prev, zoom: Math.min(1.5, prev.zoom + 0.1) }))
  }

  function zoomOut() {
    setState((prev) => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))
  }

  // Get snapshot
  useEffect(() => (screen && !isHost ? snapshot(screen.host) : void 0), [screen, isHost])

  // Update canvas when page/url changed
  useEffect(() => {
    if (url) {
      render(page, url, zoom)
    }
  }, [page, url, zoom])

  return {
    canvasElementRef,
    canControl: isHost,
    page,
    maxPages,
    zoom,
    pagePrev,
    pageNext,
    zoomIn,
    zoomOut,
  }
}
