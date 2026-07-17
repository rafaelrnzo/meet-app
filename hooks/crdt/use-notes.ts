import type { MouseEvent } from 'react'
import type { Transaction } from 'prosemirror-state'
import type { MarkType } from 'prosemirror-model'
import type { AwarenessState } from '@/lib/livekit-yjs-provider'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import * as Y from 'yjs'
import { ySyncPlugin, yUndoPlugin, yCursorPlugin, prosemirrorToYXmlFragment } from 'y-prosemirror'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { liftListItem, wrapInList, addListNodes } from 'prosemirror-schema-list'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { DOMParser, DOMSerializer, Schema } from 'prosemirror-model'
import { exampleSetup } from 'prosemirror-example-setup'
import { setBlockType } from 'prosemirror-commands'
import { ConnectionState } from 'livekit-client'
import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { LiveKitYjsProvider } from '@/lib/livekit-yjs-provider'
import { ParticipantAttribute } from '@/feat/enum'

export const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
})

export const useNotes = ({ onReady }: { onReady?: () => void }) => {
  const room = useRoomContext()
  const [editor, setEditor] = useState<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onReadyRef = useRef(onReady)
  const providerRef = useRef<LiveKitYjsProvider | null>(null)
  const { localParticipant } = useLocalParticipant()
  const roleName = localParticipant.attributes[ParticipantAttribute.RoleName.toLowerCase()]
  const isEditable = roleName !== 'user'

  const truncateName = (name: string, length: number) => {
    return name.length > length ? name.slice(0, length) + '...' : name
  }

  const cursorBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      Omit<AwarenessState, 'cursor'> | undefined

    const cursor = document.createElement('span')
    cursor.classList.add('ProseMirror-yjs-cursor')
    cursor.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)

    const label = document.createElement('div')
    label.style.setProperty('--cursor-color', participant?.color.hex ?? user.color)
    label.textContent = truncateName(participant?.name ?? user.name, 20)

    cursor.appendChild(label)
    return cursor
  })

  const selectionBuilder = useEffectEvent((user: { name: string; color: string }) => {
    const id = user.name.toLowerCase().replace('user: ', '')
    const participant = providerRef.current?.awareness.states.get(+id) as
      Omit<AwarenessState, 'cursor'> | undefined

    return {
      class: 'ProseMirror-yjs-selection',
      style: `background-color: ${participant?.color.hex ?? 'red'};`,
    }
  })

  useEffect(() => {
    if (!editor || !room) return

    const ydoc = new Y.Doc()
    const yXmlFragment = ydoc.getXmlFragment('prosemirror')

    const provider = new LiveKitYjsProvider(ydoc, room)
    const isFirstParticipant = !yXmlFragment.length && !room.remoteParticipants.size
    providerRef.current = provider

    // Only inject the preset value if the collaborative document is entirely empty
    if (isFirstParticipant && room.state === ConnectionState.Connected) {
      const presetHtml = '<h2>Ketik untuk menulis ...</h2>'

      // 1. Turn the template string into standard browser DOM elements
      const browserParser = new window.DOMParser()
      const browserDoc = browserParser.parseFromString(presetHtml, 'text/html')
      const contentElement = browserDoc.body

      // 2. Parse that DOM representation into a ProseMirror Document Node
      const pmDocNode = DOMParser.fromSchema(schema).parse(contentElement)

      // 3. Seamlessly map the ProseMirror document structure into your empty Yjs fragment
      prosemirrorToYXmlFragment(pmDocNode, yXmlFragment)
    }

    const state = EditorState.create({
      schema,
      plugins: [
        ySyncPlugin(yXmlFragment),
        yCursorPlugin(provider.awareness, { selectionBuilder, cursorBuilder }),
        yUndoPlugin(),
        ...exampleSetup({ schema, menuBar: false }),
      ],
    })

    const editable = () => !viewRef.current?.setProps({ editable: () => isEditable })

    const view = new EditorView(editor, { state, editable })
    viewRef.current = view
    onReadyRef.current?.()

    return () => {
      view.destroy()
      provider.destroy()
    }
  }, [room, isEditable, editor])

  return { viewRef, editor, isEditable, setEditor }
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
      run((state, dispatch) => {
        if (!dispatch) return false
        let tr = state.tr

        // from inside list to out of list while active heading
        liftListItem(schema.nodes.list_item)(state, (liftedTr) => {
          tr = liftedTr
        })

        // set text to heading
        const { $from, $to } = tr.selection
        tr.setBlockType($from.before($from.depth), $to.after($to.depth), schema.nodes.heading, {
          level,
        })

        dispatch(tr)
        return true
      })
    }
  }

  const handleListTypeClosure =
    (type: 'bullet_list' | 'ordered_list') => (e: MouseEvent<Element>) => {
      e.preventDefault()

      const targetListType = schema.nodes[type]
      const replaceType = type === 'bullet_list' ? 'ordered_list' : 'bullet_list'
      const replaceTarget = schema.nodes[replaceType]

      // from inside list to be out of list
      if (isInList(type)) {
        return run(liftListItem(schema.nodes.list_item))
      }

      //inside list but changed type ordered_list or bullet_list
      if (isInList(replaceType)) {
        run((state, dispatch) => {
          const tr = state.tr
          const { $from, $to } = state.selection
          tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type === replaceTarget) {
              tr.setNodeMarkup(pos, targetListType)
            }
          })
          if (dispatch) dispatch(tr)
          return true
        })
      }

      // non active heading while activated the list item
      if (isHeading(1) || isHeading(2) || isHeading(3)) {
        run((state, dispatch) => {
          if (dispatch) {
            const tr = state.tr
            const { $from, $to } = state.selection

            // set heading to paragraph
            tr.setBlockType($from.before($from.depth), $to.after($to.depth), schema.nodes.paragraph)

            //get range of paragraph
            const range = tr.selection.$from.blockRange(tr.selection.$to)

            //wrapping the paragraph to list item
            if (range) {
              const wrappers = [{ type: targetListType }, { type: schema.nodes.list_item }]
              tr.wrap(range, wrappers)
            }

            dispatch(tr)
            return true
          }
          return false
        })
      }

      // from out of list to be inside list only paragraph
      run(wrapInList(schema.nodes[type]))
    }

  const handleDownload = async (e: MouseEvent<Element>) => {
    e.preventDefault()

    if (!editorEl || !state) return

    const serializer = DOMSerializer.fromSchema(state?.schema)
    const fragment = serializer.serializeFragment(state.doc.content)

    const cleanContainer = document.createElement('div')
    cleanContainer.appendChild(fragment)

    if (editorEl) {
      cleanContainer.className = editorEl.className
    }

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

      await pdf.html(cleanContainer, {
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
