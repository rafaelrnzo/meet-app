'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

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

const PDFViewerDynamic = dynamic(() => import('./PDFBase'), {
  ssr: false,
  loading: () => (
    <div className='bg-background border-border text-muted-foreground relative mt-3 flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border shadow-sm'>
      <Loader2 className='animate-spin' />
      <span>Loading PDF Viewer...</span>
    </div>
  ),
})

export function PDFSlideViewer(props: PDFSlideViewerProps) {
  if (!props.isOpen || !props.url) return null
  return <PDFViewerDynamic {...props} />
}
