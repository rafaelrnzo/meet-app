'use client'

import type { FC, ReactNode } from 'react'
import type { EditorView } from 'prosemirror-view'
import { toggleMark } from 'prosemirror-commands'
import { ArrowLineDownIcon, TextBolderIcon, TextItalicIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { schema, useNotesToolbar } from '@/hooks/crdt/use-notes'
import { Button } from '@/components/ui/button'
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
  <Button
    variant={active ? 'primary' : 'secondary-outline'}
    title={title}
    onMouseDown={onMouseDown}
    className={cn(
      !active && 'hover:border-red-800 hover:bg-red-50 hover:text-red-800',
      'h-9 rounded-md px-2 py-1 text-sm font-medium transition-colors'
    )}
  >
    {label}
  </Button>
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
    <div className='px-5'>
      <div className='flex flex-wrap items-center gap-1 border-b border-red-800 bg-white pt-6 pb-2'>
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
        <NotesToolbarButton
          label={<HugeIcon icon={LeftToRightListBulletIcon} size={18} />}
          title='Unordered list'
          active={isInList('bullet_list')}
          onMouseDown={handleListTypeClosure('bullet_list')}
        />
        <NotesToolbarButton
          label={<HugeIcon icon={LeftToRightListNumberIcon} size={18} />}
          title='Ordered list'
          active={isInList('ordered_list')}
          onMouseDown={handleListTypeClosure('ordered_list')}
        />

        {/* Download */}
        <NotesToolbarButton
          label={<ArrowLineDownIcon size={18} />}
          title='Download as .txt'
          onMouseDown={handleDownload}
        />
      </div>
    </div>
  )
}
