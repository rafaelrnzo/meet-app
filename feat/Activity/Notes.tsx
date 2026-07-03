'use client'

import type { FC } from 'react'
import { useNotes } from '@/hooks/crdt/use-notes'
import { NotesToolbarEditor } from '@/components/NotesToolbar'

import '@/app/prose.css'

export const Notes: FC<{ onReady?: () => void }> = ({ onReady }) => {
  const { viewRef, editorRef } = useNotes({ onReady })

  return (
    <div className='absolute inset-0 flex flex-col bg-white text-black'>
      <NotesToolbarEditor getView={() => viewRef.current} editorEl={editorRef.current} />
      <div ref={editorRef} className='h-full w-full flex-1 overflow-auto p-5' />
    </div>
  )
}

export default Notes
