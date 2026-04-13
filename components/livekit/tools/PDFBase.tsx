'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, X } from 'lucide-react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { updateRoomPermissions } from '@/lib/api/admin-api'
import { toast } from 'sonner'

import { Worker, Viewer } from '@react-pdf-viewer/core'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/core/lib/styles/index.css'

// We use pdfjs-dist@3.11.174 which is compatible with @react-pdf-viewer/core@3.12.0
const workerUrl = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`

interface PDFSlideViewerProps {
  url: string
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
  roomName: string
  mode?: 'overlay' | 'embedded'
  onToggleMinimize?: () => void
  isMinimized?: boolean
}

export default function PDFBase({
  url,
  isOpen,
  onClose,
  isAdmin,
  roomName,
  mode = 'overlay',
  onToggleMinimize,
  isMinimized = false,
}: PDFSlideViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()

  // We don't use jumpToPage from pageNavigationPluginInstance because it causes hook order issues and loses context
  // Instead we use the pageNumber state natively with the `initialPage` and `key` props on the Viewer
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const plugins = useMemo(() => [pageNavigationPluginInstance], [pageNavigationPluginInstance])

  useEffect(() => {
    setPageNumber(1)
    setIsLoading(true)
  }, [url])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.getBoundingClientRect()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, isMinimized, mode])

  useEffect(() => {
    if (!room) return

    const checkMetadata = () => {
      try {
        const md = room.metadata ? JSON.parse(room.metadata) : {}
        if (md.presentation && typeof md.presentation.page === 'number') {
          setPageNumber(md.presentation.page)
        }
      } catch (e) {
        console.error('Failed to parse metadata', e)
      }
    }
    checkMetadata()

    room.on(RoomEvent.RoomMetadataChanged, checkMetadata)
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, checkMetadata)
    }
  }, [room, numPages])

  const handleDocumentLoad = (e: any) => {
    setNumPages(e.doc.numPages)
    setIsLoading(false)

    // Sync to correct page on initial load
    if (room?.metadata) {
      try {
        const md = JSON.parse(room.metadata)
        if (md.presentation && typeof md.presentation.page === 'number') {
          setPageNumber(md.presentation.page)
        }
      } catch (err) {}
    }
  }

  const handlePageChange = (e: any) => {
    // e.currentPage is 0-indexed
    setPageNumber(e.currentPage + 1)
  }

  const changePage = async (offset: number) => {
    const newPage = pageNumber + offset
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage)

      if (isAdmin) {
        try {
          const currentMeta = room?.metadata ? JSON.parse(room.metadata) : {}
          const newMeta = {
            ...currentMeta,
            presentation: {
              ...currentMeta.presentation,
              page: newPage,
            },
          }
          await updateRoomPermissions(roomName, newMeta)
        } catch (e) {
          console.error('Failed to sync page', e)
          toast.error('Failed to sync slide position')
        }
      }
    }
  }

  if (!isOpen || !url) return null

  return (
    <div
      ref={containerRef}
      className={`bg-background border-border relative flex flex-col overflow-hidden border shadow-md ${
        mode === 'overlay'
          ? `fixed z-[60] shadow-2xl transition-all duration-300 ease-in-out ${
              isMinimized
                ? 'right-5 bottom-5 h-[240px] w-[320px] rounded-lg'
                : 'inset-4 rounded-xl md:inset-10'
            }`
          : 'h-full w-full rounded-lg'
      } `}
    >
      {/* Header / Controls */}
      <div
        className={`bg-muted/80 text-foreground border-border z-10 flex items-center justify-between border-b px-4 py-2 backdrop-blur ${isMinimized ? 'px-2 py-1' : ''} `}
      >
        <div className='flex items-center gap-2 overflow-hidden'>
          <span className='truncate text-sm font-semibold'>Presentation</span>
          {!isMinimized && (
            <span className='text-muted-foreground text-xs'>
              ({pageNumber} / {numPages || '-'})
            </span>
          )}
        </div>

        <div className='flex items-center gap-1'>
          {mode === 'overlay' && onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className='hover:bg-background/80 hover:text-foreground rounded p-1.5 transition-colors'
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}
          <button
            onClick={onClose}
            className='hover:bg-destructive hover:text-destructive-foreground rounded p-1.5 transition-colors'
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className='bg-muted/30 relative flex flex-1 items-center justify-center overflow-hidden dark:bg-black/40'>
        {isLoading && (
          <div className='text-muted-foreground absolute inset-0 z-10 flex items-center justify-center gap-2'>
            <Loader2 className='animate-spin' />
            <span>Loading Slides...</span>
          </div>
        )}

        <div className='flex h-full w-full flex-col'>
          <Worker workerUrl={workerUrl}>
            <Viewer
              key={`pdf-viewer-page-${pageNumber}`}
              fileUrl={url}
              plugins={plugins}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
              initialPage={pageNumber - 1}
              theme='dark'
            />
          </Worker>
        </div>

        {/* Overlay Controls (Previous/Next) */}
        {!isMinimized && !isLoading && (
          <>
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className={`bg-background/80 text-foreground hover:bg-background border-border absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full border p-3 shadow-sm backdrop-blur transition-all disabled:pointer-events-none disabled:opacity-0 ${!isAdmin ? 'hidden' : ''} `}
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className={`bg-background/80 text-foreground hover:bg-background border-border absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full border p-3 shadow-sm backdrop-blur transition-all disabled:pointer-events-none disabled:opacity-0 ${!isAdmin ? 'hidden' : ''} `}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Footer Control Bar */}
      {!isMinimized && !isLoading && (
        <div className='bg-muted/80 border-border text-foreground z-10 flex items-center justify-center gap-4 border-t p-3 backdrop-blur'>
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1 || !isAdmin}
            className='hover:bg-background/80 text-muted-foreground hover:text-foreground rounded p-2 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <ChevronLeft size={20} />
          </button>

          <span className='min-w-[3rem] text-center text-sm font-medium'>
            {pageNumber} / {numPages || '-'}
          </span>

          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages || !isAdmin}
            className='hover:bg-background/80 text-muted-foreground hover:text-foreground rounded p-2 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <ChevronRight size={20} />
          </button>

          {!isAdmin && (
            <span className='text-muted-foreground absolute right-4 flex items-center gap-1 text-xs'>
              Controlled by Host
            </span>
          )}
        </div>
      )}
    </div>
  )
}
