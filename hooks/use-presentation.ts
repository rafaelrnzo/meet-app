import type { pdfjs } from 'react-pdf'
import { useState, useRef, useEffect, useEffectEvent } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useDataChannel, useSnapshotEffect } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { LiveKitAction } from '@/feat/enum'

export function usePresentation(onReady?: () => void) {
  const isRenderingRef = useRef(false)
  const { role } = useAuth()
  const isHost = role?.name === 'admin' || role?.name === 'moderator'
  const [{ page, zoom }, setState] = useState({ page: 1, zoom: 1 })
  const [maxPages, setMaxPages] = useState(1)
  const { screen } = useRoomState()
  const onReadyRef = useRef(onReady)
  const url = screen?.url ?? ''
  const canvasElementRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<typeof pdfjs | null>(null)
  const docRef = useRef<pdfjs.PDFDocumentProxy | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loopIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    if (docRef.current) {
      setMaxPages(docRef.current.numPages)
    }

    return docRef.current
  }

  const render = useEffectEvent(async (pageNumber: number, url: string, zoomCurrent: number) => {
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

      await task.promise

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      ctx.drawImage(offScreenCanvas, 0, 0)

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
    setState((prev) => ({ ...prev, page: Math.min(maxPages, prev.page + 1) }))
  }
  function zoomIn() {
    // max 1x the original size
    setState((prev) => ({ ...prev, zoom: Math.min(1, prev.zoom + 0.01) }))
  }

  function zoomOut() {
    // min 0.5x the original size
    setState((prev) => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.01) }))
  }

  function startHoldZoom(zoomAction: () => void) {
    if (loopIntervalRef.current) return
    zoomAction()
    startTimeoutRef.current = setTimeout(() => {
      loopIntervalRef.current = setInterval(() => {
        zoomAction()
      }, 100)
    }, 350)
  }

  function stopHoldZoom() {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current)
      loopIntervalRef.current = null
    }
  }

  // Snapshot: Sync participant initial page with latest host page
  // Careful! This action will be effect host state during cleanup
  useSnapshotEffect(page, (syncedPage) => {
    if (page !== syncedPage) {
      setState((prev) => ({ ...prev, page: syncedPage }))
    }
  })

  // Update canvas when page/url changed
  useEffect(() => {
    if (url) {
      void render(page, url, zoom)
    }
  }, [page, url, zoom])

  return {
    canvasElementRef,
    canControl: isHost,
    pagination: {
      pagePrev,
      pageNext,
      currentPage: page,
      maxPages,
    },
    zoomTrack: {
      zoomIn,
      zoomOut,
      currentZoom: zoom,
      startHoldZoom,
      stopHoldZoom,
    },
  }
}
