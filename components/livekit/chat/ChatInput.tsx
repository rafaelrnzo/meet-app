import React, { useRef, useState } from 'react'
import { Clipboard, Send } from 'lucide-react'

interface ChatInputProps {
  activeParticipantName: string
  onSendText: (value: string) => Promise<void>
  onSendImage: (file: File) => Promise<void>
}

export function ChatInput({ activeParticipantName, onSendText, onSendImage }: ChatInputProps) {
  const [value, setValue] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.includes('image')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await onSendImage(file)
        }
        break
      }
    }
  }

  const handleSendText = async () => {
    const t = value.trim()
    if (!t) return
    await onSendText(t)
    setValue('')
  }

  return (
    <div className='border-border bg-muted/30 border-t p-3'>
      <div className='flex items-center gap-2'>
        <input
          className='border-border bg-background text-foreground focus:ring-primary/70 h-9 flex-1 rounded-lg border px-3 text-sm transition-all outline-none focus:ring-2'
          placeholder={`Message ${activeParticipantName}...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendText()
            }
          }}
        />

        <input
          ref={fileRef}
          type='file'
          accept='image/*'
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            await onSendImage(f)
            e.currentTarget.value = ''
          }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className='border-border bg-card text-foreground hover:bg-muted h-9 rounded-lg border px-3 text-sm font-medium transition-all'
          title='Send image'
        >
          <Clipboard className='h-4 w-4' />
        </button>

        <button
          onClick={handleSendText}
          disabled={!value.trim()}
          className='border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-lg border p-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Send className='h-4 w-4' />
        </button>
      </div>
    </div>
  )
}
