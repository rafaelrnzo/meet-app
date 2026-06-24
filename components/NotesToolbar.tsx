'use client'

import type { FC, ReactNode } from 'react'
import type { EditorView } from 'prosemirror-view'
import { toggleMark } from 'prosemirror-commands'
import { ArrowLineDownIcon, TextBolderIcon, TextItalicIcon } from '@phosphor-icons/react'
import { schema, useNotesToolbar } from '@/hooks/crdt/use-notes'
import {
  HugeIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
} from '@/components/HugeIcon'

export interface NotesToolbarEditorProps {
  getView: () => EditorView | null
  editorEl: HTMLElement | null
}

export interface NotesToolbarButtonProps {
  label: ReactNode
  title: string
  active?: boolean
  onMouseDown: (e: React.MouseEvent) => void
}

export const NotesToolbarButton: FC<NotesToolbarButtonProps> = ({
  label,
  title,
  active,
  onMouseDown,
}) => (
  <button
    title={title}
    onMouseDown={onMouseDown}
    className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
      active ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {label}
  </button>
)

export const NotesToolbarEditor: FC<NotesToolbarEditorProps> = ({ getView, editorEl }) => {
  const {
    run,
    isHeading,
    isInList,
    isMark,
    handleDownload,
    handleHeadingClosure,
    handleListTypeClosure,
  } = useNotesToolbar(getView, editorEl)

  return (
    <div className='flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-white px-3 py-1.5 pr-2.5'>
      {/* Bold / Italic */}
      <NotesToolbarButton
        label={<TextBolderIcon weight='bold' size={18} />}
        title='Bold'
        active={isMark(schema.marks.strong)}
        onMouseDown={(e) => {
          e.preventDefault()
          run(toggleMark(schema.marks.strong))
        }}
      />
      <NotesToolbarButton
        label={<TextItalicIcon weight='bold' size={18} />}
        title='Italic'
        active={isMark(schema.marks.em)}
        onMouseDown={(e) => {
          e.preventDefault()
          run(toggleMark(schema.marks.em))
        }}
      />

      {/* Divider */}
      <div className='mx-1 h-5 w-px bg-gray-200' />

      {/* Headings */}
      {([1, 2, 3] as const).map((level) => (
        <NotesToolbarButton
          key={level}
          label={`H${level}`}
          title={`Heading ${level}`}
          active={isHeading(level)}
          onMouseDown={handleHeadingClosure(level)}
        />
      ))}

      {/* Divider */}
      <div className='mx-1 h-5 w-px bg-gray-200' />

      {/* Lists */}
      <button
        title='Unordered list'
        onMouseDown={handleListTypeClosure('bullet_list')}
        className={`rounded p-1.5 transition-colors ${
          isInList('bullet_list') ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <HugeIcon icon={LeftToRightListBulletIcon} size={20} />
      </button>
      <button
        title='Ordered list'
        onMouseDown={handleListTypeClosure('ordered_list')}
        className={`rounded p-1.5 transition-colors ${
          isInList('ordered_list') ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <HugeIcon icon={LeftToRightListNumberIcon} size={20} />
      </button>

      {/* Divider */}
      <div className='mx-1 h-5 w-px bg-gray-200' />

      {/* Download */}
      <button
        title='Download as .txt'
        className='rounded p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900'
        onMouseDown={handleDownload}
      >
        <ArrowLineDownIcon size={20} />
      </button>
    </div>
  )
}
