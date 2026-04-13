import React, { useEffect, useState } from 'react'
import { ChevronDown, Ban } from 'lucide-react'
import { LinkPreview } from './LinkPreview'
import { ChatItem } from './types'

const URL_REGEX = /(https?:\/\/[^\s]+)/g

export function BlobImage({
  blob,
  alt,
  className,
}: {
  blob: Blob
  alt?: string
  className?: string
}) {
  const [src, setSrc] = useState<string>('')

  useEffect(() => {
    if (!blob || !(blob instanceof Blob)) return
    const url = URL.createObjectURL(blob)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])

  if (!src)
    return <div className={`bg-muted animate-pulse ${className}`} style={{ minHeight: '100px' }} />

  return <img src={src} alt={alt} className={className} />
}

interface ChatMessageProps {
  m: ChatItem
  activeTab: string
  onContextMenu: (e: React.MouseEvent, item: ChatItem) => void
}

export function ChatMessage({ m, activeTab, onContextMenu }: ChatMessageProps) {
  return (
    <div id={`msg-${m.id}`} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group/bubble relative max-w-[85%] rounded-lg border px-3 py-2 text-sm transition-all ${
          m.mine
            ? 'bg-primary/90 text-primary-foreground border-primary/40'
            : 'bg-muted/70 text-foreground border-border'
        }`}
      >
        <button
          className={`border-border bg-background text-foreground hover:bg-muted absolute top-0 right-0 z-10 translate-x-1/3 -translate-y-1/3 transform rounded-full border p-1 opacity-0 shadow-sm transition-opacity group-hover/bubble:opacity-100 ${m.isDeleted ? 'hidden' : ''}`}
          onClick={(e) => onContextMenu(e, m)}
        >
          <ChevronDown className='h-3 w-3' />
        </button>
        {!m.mine && activeTab === 'everyone' && (
          <div className='text-muted-foreground mb-1 text-[11px]'>{m.from}</div>
        )}

        {m.isDeleted ? (
          <div className='text-muted-foreground flex items-center gap-1.5 italic'>
            <Ban className='h-3.5 w-3.5 opacity-50' />
            <span>This message was deleted</span>
          </div>
        ) : (
          <>
            {m.type === 'text' ? (
              <div className='break-words whitespace-pre-wrap'>
                {m.text}
                {m.text.match(URL_REGEX) && <LinkPreview url={m.text.match(URL_REGEX)![0]} />}
              </div>
            ) : (
              <BlobImage
                blob={m.blob}
                alt='chat image'
                className='border-border/30 block h-auto w-full rounded-lg border object-contain'
              />
            )}
          </>
        )}

        <div className='mt-1 text-right text-[10px] opacity-60'>
          {new Date(m.ts).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
