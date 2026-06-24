import type { pdfjs } from 'react-pdf'
import { useState, useRef, useEffect, useEffectEvent } from 'react'
import { useDataChannel, useSnapshotEffect } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'

export function usePresentation(onReady?: () => void) {
  const [{ page }, setState] = useState({ page: 1, zoom: 1 })
  const { screen, isHost } = useRoomState()
  const onReadyRef = useRef(onReady)
  const url = screen?.url ?? ''
  const canvasElementRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<typeof pdfjs | null>(null)
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const isRenderingRef = useRef(false)

  const { send: syncPresentation } = useDataChannel<number>(
    LiveKitAction.PresentationUpdate,
    ({ payload }) => {
      if (payload && !isHost) {
        setState((prev) => ({ ...prev, page: payload }))
      }
    }
  )

  const loadParser = async () => {
    const pdfjs = (await import('react-pdf')).pdfjs

    // Required
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    pdfRef.current = pdfjs

    onReadyRef.current?.()
    return pdfjs
  }

  const getParser = async (url: string) => {
    if (pdfRef.current) {
      docRef.current = await pdfRef.current.getDocument(url).promise
    } else {
      const pdfjs = await loadParser()
      docRef.current = await pdfjs.getDocument(url).promise
    }

    return docRef.current
  }

  const render = useEffectEvent(async (pageNumber: number, url: string) => {
    const canvas = canvasElementRef.current

    if (!canvas || isRenderingRef.current) {
      return
    }

    // Mark first
    isRenderingRef.current = true

    try {
      const parser = await getParser(url)
      const page = await parser.getPage(pageNumber)
      const viewport = page.getViewport({
        scale: 1.5,
      })

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      const task = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      })

      await task.promise

      if (isHost) {
        syncPresentation(pageNumber)
      }
    } finally {
      isRenderingRef.current = false
    }
  })

  function pagePrev() {
    setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
  }

  function pageNext() {
    setState((prev) => ({ ...prev, page: Math.min(3, prev.page + 1) }))
  }

  // Snapshot: Sync participant initial page with latest host page
  // Careful! This action will be effect host state during cleanup
  useSnapshotEffect(page, (syncedPage) => {
    if (page !== syncedPage) {
      setState((prev) => ({ ...prev, page: syncedPage }))
    }
  })

  // Update canvas when page/url changed
  useEffect(() => void render(page, url), [page, url])

  return { canvasElementRef, canControl: isHost, pagePrev, pageNext }
}
