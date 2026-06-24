import type { MouseEvent } from 'react'
import type { Transaction } from 'prosemirror-state'
import type { MarkType } from 'prosemirror-model'
import type { AwarenessState } from '@/lib/livekit-yjs-provider'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import * as Y from 'yjs'
import { ySyncPlugin, yUndoPlugin, yCursorPlugin } from 'y-prosemirror'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { liftListItem, wrapInList, addListNodes } from 'prosemirror-schema-list'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { Schema } from 'prosemirror-model'
import { exampleSetup } from 'prosemirror-example-setup'
import { setBlockType } from 'prosemirror-commands'
import { useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'

export const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
})

export const useNotes = ({ onReady }: { onReady?: () => void }) => {
  const room = useRoomContext()
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onReadyRef = useRef(onReady)
  const providerRef = useRef<LiveKitYjsProvider | null>(null)

  const cursorBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      | Omit<AwarenessState, 'cursor'>
      | undefined

    const cursor = document.createElement('span')
    cursor.classList.add('ProseMirror-yjs-cursor')
    cursor.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)

    const label = document.createElement('div')
    label.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)
    label.textContent = participant?.name ?? user.name

    cursor.appendChild(label)
    return cursor
  })

  const selectionBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      | Omit<AwarenessState, 'cursor'>
      | undefined

    return {
      class: 'ProseMirror-yjs-selection',
      style: `background-color: ${participant?.color.hex ?? 'red'};`,
    }
  })

  useEffect(() => {
    if (!editorRef.current || !room) return

    const ydoc = new Y.Doc()
    const yXmlFragment = ydoc.getXmlFragment('prosemirror')

    const provider = new LiveKitYjsProvider(ydoc, room)
    providerRef.current = provider

    const state = EditorState.create({
      schema,
      plugins: [
        ySyncPlugin(yXmlFragment),
        yCursorPlugin(provider.awareness, { selectionBuilder, cursorBuilder }),
        yUndoPlugin(),
        ...exampleSetup({ schema, menuBar: false }),
      ],
    })

    const view = new EditorView(editorRef.current, { state })
    viewRef.current = view
    onReadyRef.current?.()

    return () => {
      view.destroy()
      provider.destroy()
    }
  }, [room])

  return { viewRef, editorRef }
}

export const useNotesToolbar = (getView: () => EditorView | null, editorEl: HTMLElement | null) => {
  // Re-render on every selection change so active states update
  const [, forceUpdate] = useState(0)

  // Requires `useCallback` due to force update
  const run = useCallback(
    (command: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean) => {
      const view = getView()

      if (view) {
        command(view.state, view.dispatch)
        view.focus()
      }
    },
    [getView]
  )

  const view = getView()
  const state = view?.state

  // prettier-ignore
  const isHeading = (level: number) => (
      state?.selection.$from.parent.type === schema.nodes.heading &&
      state?.selection.$from.parent.attrs.level === level
    )

  const isInList = (listType: 'bullet_list' | 'ordered_list') => {
    if (state) {
      const { $from } = state.selection

      for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type === schema.nodes[listType]) {
          return true
        }
      }
    }

    return false
  }

  const isMark = (markType: MarkType) => {
    if (state) {
      const { from, $from, to, empty } = state.selection

      if (empty) {
        return !!markType.isInSet(state.storedMarks ?? $from.marks())
      }

      return state.doc.rangeHasMark(from, to, markType)
    }

    return false
  }

  const handleHeadingClosure = (level: 1 | 2 | 3) => (e: MouseEvent<Element>) => {
    e.preventDefault()

    if (isHeading(level)) {
      run(setBlockType(schema.nodes.paragraph))
    } else {
      run(setBlockType(schema.nodes.heading, { level }))
    }
  }

  const handleListTypeClosure =
    (type: 'bullet_list' | 'ordered_list') => (e: MouseEvent<Element>) => {
      e.preventDefault()

      if (isInList(type)) {
        run(liftListItem(schema.nodes.list_item))
      } else {
        run(wrapInList(schema.nodes[type]))
      }
    }

  const handleDownload = async (e: MouseEvent<Element>) => {
    e.preventDefault()

    if (!editorEl) return

    const style = document.createElement('style')
    style.textContent = `
        * {
          color: revert !important;
          background-color: revert !important;
          border-color: revert !important;
        }
      `

    document.head.appendChild(style)

    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')

      await pdf.html(editorEl, {
        callback: function (doc) {
          doc.save('dokumen.pdf')
        },
        width: 190, // lebar konten dalam mm (sesuaikan dengan lebar A4)
        windowWidth: 794, // lebar area konten dalam pixel
        margin: [20, 20, 20, 20],
        autoPaging: 'text', // Ini kunci agar teks tidak terpotong di tengah
      })
    } catch (e) {
      alert('Gagal mengunduh dokumen')
      console.log('Failed to download document:', e)
    } finally {
      document.head.removeChild(style)
    }
  }

  useEffect(() => {
    // Poll isn't ideal — better to subscribe via a ProseMirror plugin,
    // but for simplicity this works fine for a toolbar.
    const id = setInterval(() => forceUpdate((n) => n + 1), 150)
    return () => clearInterval(id)
  }, [])

  return {
    run,
    isHeading,
    isInList,
    isMark,
    handleDownload,
    handleHeadingClosure,
    handleListTypeClosure,
  }
}
