import type { ReceivedChatMessage } from '@livekit/components-core'
import * as React from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { tokenize, createDefaultGrammar } from '@livekit/components-core'
import { cn } from '@/lib/utils'
import { LOCAL_MESSAGE_DELETED_EVENT } from '@/feat/Activity/Chat'
import { ModalDelete } from '@/components/ui/modal'
import { MessageMenu } from '@/components/ui/MessageMenu'
import { Icon } from '@/components/ui/icon'

/** @public */
export type MessageFormatter = (message: string) => React.ReactNode

/**
 * ChatEntry composes the HTML div element under the hood, so you can pass all its props.
 * These are the props specific to the ChatEntry component:
 * @public
 */
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean
  /** Hide message timestamp. */
  hideTimestamp?: boolean
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter
  isDeleted?: boolean
}

/**
 * The `ChatEntry` component holds and displays one chat message.
 *
 * @example
 * ```tsx
 * <Chat>
 *   <ChatEntry />
 * </Chat>
 * ```
 * @see `Chat`
 * @public
 */
export const ChatEntry: (
  props: ChatEntryProps & React.RefAttributes<HTMLLIElement>
) => React.ReactNode = React.forwardRef<HTMLLIElement, ChatEntryProps>(function ChatEntry(
  {
    entry,
    hideName = false,
    hideTimestamp = false,
    messageFormatter,
    isDeleted = false,
    ...props
  }: ChatEntryProps,
  ref
) {
  const formattedMessage = React.useMemo(() => {
    return messageFormatter ? messageFormatter(entry.message) : entry.message
  }, [entry.message, messageFormatter])
  const textRef = React.useRef<HTMLParagraphElement>(null)
  const [overflow, setOverflow] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [isModalConfirm, setModalConfirm] = React.useState(false)
  const hasBeenEdited = !!entry.editTimestamp
  const time = new Date(entry.timestamp)
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  const name = entry.from?.name ?? entry.from?.identity
  const { localParticipant } = useLocalParticipant()

  React.useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return

    setOverflow(el.scrollHeight > el.clientHeight)
  }, [formattedMessage])

  const deleteMessage = async () => {
    try {
      const payload = {
        action: 'DELETE_MESSAGE',
        targetId: entry.id,
      }
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify(payload))

      await localParticipant.publishData(data, { reliable: true })

      window.dispatchEvent(new CustomEvent(LOCAL_MESSAGE_DELETED_EVENT, { detail: entry.id }))
    } catch (error) {
      console.error('Failed to delete message', error)
    } finally {
      setModalConfirm(false)
    }
  }

  return (
    <>
      <li
        ref={ref}
        className={cn(
          'lk-chat-entry group relative transition-all',
          !entry.from?.isLocal ? 'pl-[54px]' : ''
        )}
        title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
        data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
        {...props}
      >
        {!entry.from?.isLocal && (
          <div
            className={cn(
              'absolute bottom-3 left-0 flex aspect-square h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-400 bg-red-50 text-sm transition-opacity',
              hideName ? 'pointer-events-none opacity-0' : 'opacity-100'
            )}
          >
            <span className='font-semibold text-red-800 uppercase'>
              {name ? name.slice(0, 2) : name}
            </span>
          </div>
        )}

        {(!hideTimestamp || !hideName || hasBeenEdited) && (
          <span className='lk-meta-data'>
            {!hideName && (
              <span
                className='lk-participant-name font-semibold text-red-800'
                style={{ fontSize: '1rem' }}
              >
                {name}
              </span>
            )}
          </span>
        )}

        <div
          className={cn('lk-message-body relative text-inherit', {
            'text-white': entry.from?.isLocal,
          })}
          style={{ padding: '.10rem .75rem .10rem .75rem' }}
        >
          {isDeleted ? (
            <p
              className={cn('flex items-center gap-1.5 text-neutral-500 italic select-none', {
                'text-white/80': entry.from?.isLocal,
              })}
            >
              <Icon type='block' />
              <span>Pesan ini telah dihapus</span>
            </p>
          ) : (
            <>
              <p
                ref={textRef}
                className={cn('pr-5 break-words whitespace-pre-wrap', !expanded && `line-clamp-12`)}
              >
                {formattedMessage}
              </p>

              {overflow && !expanded && (
                <button
                  type='button'
                  onClick={() => setExpanded((v) => !v)}
                  className={cn('mt-0 text-xs font-medium hover:underline', {
                    'text-white': entry.from?.isLocal,
                  })}
                >
                  <span>Baca selengkapnya</span>
                </button>
              )}

              <MessageMenu {...{ entry, setModalConfirm }} />
            </>
          )}

          <div className='text-right text-[10px] opacity-65'>
            <span
              className={cn('lk-timestamp', {
                'text-white': entry.from?.isLocal,
              })}
            >
              {!isDeleted && hasBeenEdited && 'edited '}
              {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {!isDeleted && (
          <span className='lk-message-attachements'>
            {entry.attachedFiles?.map(
              (file) =>
                file.type.startsWith('image/') && (
                  <img
                    style={{ maxWidth: '300px', maxHeight: '300px' }}
                    key={file.name}
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                  />
                )
            )}
          </span>
        )}
      </li>

      <ModalDelete
        root={{
          open: isModalConfirm,
          onOpenChange: setModalConfirm,
          modal: false,
        }}
        title={{
          children: 'Hapus pesan?',
        }}
        submit={{
          children: 'Hapus Pesan',
          onClick: deleteMessage,
        }}
        cancel={{
          children: 'Batal',
          onClick: () => setModalConfirm(false),
        }}
        content={{
          onPointerDownOutside: (e) => e.preventDefault(),
          onInteractOutside: (e) => e.preventDefault(),
          onCloseAutoFocus: (e) => e.preventDefault(),
          className: 'max-w-[1170px]',
        }}
        close={{
          onClick: () => setModalConfirm(false),
        }}
      >
        <p>
          Tindakan ini akan menghapus pesan ini untuk semua orang. Tindakan ini tidak dapat
          dibatalkan.
        </p>
      </ModalDelete>
    </>
  )
})

/** @public */
export function formatChatMessageLinks(message: string): React.ReactNode {
  return tokenize(message, createDefaultGrammar()).map((tok, i) => {
    if (typeof tok === `string`) {
      return tok
    } else {
      const content = tok.content.toString()
      const href =
        tok.type === `url`
          ? /^http(s?):\/\//.test(content)
            ? content
            : `https://${content}`
          : `mailto:${content}`
      return (
        <a className='lk-chat-link' key={i} href={href} target='_blank' rel='noreferrer'>
          {content}
        </a>
      )
    }
  })
}
