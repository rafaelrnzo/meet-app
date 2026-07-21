import type { FC, FormEvent, CSSProperties } from 'react'
import type { ChatMessage } from 'livekit-client'
import type { ChatProps } from '@livekit/components-react'
import type { ChatOptions } from '@livekit/components-core'
import { useRef, useEffect, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { RoomEvent } from 'livekit-client'
import { useChat, useMaybeLayoutContext, useRoomContext } from '@livekit/components-react'
import { cn, decoder } from '@/lib/utils'
import { useParamsState } from '@/hooks'
import { cloneSingleChild } from '@/feat/helpers'
import { ChatEntry } from '@/components/ChatEntry'
import { Button } from '@/components/Button'

export const LOCAL_MESSAGE_DELETED_EVENT = 'local-message-deleted'

/**
 * Modify original chat
 *
 * @see https://github.com/livekit/components-js/blob/main/packages/react/src/prefabs/Chat.tsx
 */
export const Chat: FC<ChatProps> = ({
  messageFormatter,
  messageDecoder,
  messageEncoder,
  channelTopic,
  ...props
}) => {
  const ulRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatOptions: ChatOptions = useMemo(() => {
    return { messageDecoder, messageEncoder, channelTopic }
  }, [messageDecoder, messageEncoder, channelTopic])

  const { chatMessages, send, isSending } = useChat(chatOptions)
  const { isPanelActive, isTabsChats } = useParamsState()
  const layoutContext = useMaybeLayoutContext()
  const lastReadMsgAt = useRef<ChatMessage['timestamp']>(0)
  const room = useRoomContext()
  const [deletedIds, setDeletedIds] = useState<string[]>([])

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const rawString = decoder.decode(payload)

        // Invalid json parse
        if (!rawString.trim().startsWith('{')) {
          return
        }

        const data = JSON.parse(rawString) as { action?: string; targetId?: string }
        if (data.action === 'DELETE_MESSAGE' && data.targetId) {
          setDeletedIds((prev) => [...prev, data.targetId!])
        }
      } catch (e) {
        console.log('Failed to receive the message:', e)
      }
    }

    const handleLocalDelete = (e: Event) => {
      const messageId = (e as CustomEvent).detail as string
      setDeletedIds((prev) => [...prev, messageId])
    }

    room.on(RoomEvent.DataReceived, handleDataReceived)
    window.addEventListener(LOCAL_MESSAGE_DELETED_EVENT, handleLocalDelete)

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
      window.removeEventListener(LOCAL_MESSAGE_DELETED_EVENT, handleLocalDelete)
    }
  }, [room])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      await send(inputRef.current.value)
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  useEffect(() => {
    if (isPanelActive && isTabsChats) {
      lastReadMsgAt.current = Date.now()
    }
  }, [isPanelActive, isTabsChats])

  useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight })
    }
  }, [ulRef, chatMessages])

  useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) return

    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp
      return
    }

    const unreadMessageCount = chatMessages.filter(
      (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current
    ).length

    const { widget } = layoutContext
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount })
    }
  }, [chatMessages, layoutContext])

  return (
    <div {...props} className='grid h-full w-full grid-rows-[1fr_auto] p-5'>
      <ul
        className={cn(
          'flex max-h-full w-full flex-col items-end gap-3 overflow-auto pb-5',
          '*:m-0! *:w-full *:data-lk-message-origin:*:m-0! *:data-lk-message-origin:gap-0! *:data-lk-message-origin:*:first:w-fit *:data-lk-message-origin:*:first:gap-2',
          '*:data-[lk-message-origin=local]:[&>.lk-message-body]:bg-primary! *:data-[lk-message-origin=local]:[&>.lk-message-body]:text-primary-foreground! *:data-[lk-message-origin=local]:items-end',
          '*:data-[lk-message-origin=remote]:[&>.lk-message-body]:bg-secondary!'
        )}
        ref={ulRef}
        style={
          {
            '--lk-fg': 'var(--background)',
            '--lk-bg5': 'var(--secondary)',
            '--lk-fg5': 'var(--secondary-foreground)',
            '--lk-accent4': 'var(--primary)',
          } as CSSProperties
        }
      >
        {props.children
          ? chatMessages.map((msg, idx) =>
              cloneSingleChild(props.children, {
                entry: msg,
                key: msg.id ?? idx,
                messageFormatter,
                isDeleted: deletedIds.includes(msg.id),
              })
            )
          : chatMessages.map((msg, idx, allMsg) => {
              const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from
              const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000
              const isDeleted = deletedIds.includes(msg.id)

              return (
                <ChatEntry
                  key={msg.id ?? idx}
                  hideName={hideName}
                  hideTimestamp={hideName === false ? false : hideTimestamp}
                  entry={msg}
                  messageFormatter={messageFormatter}
                  isDeleted={isDeleted}
                />
              )
            })}
      </ul>

      <form
        className='bg-background text-foreground sticky bottom-0 z-[100] flex gap-3 shadow-[0_-4px_8px_rgba(255,255,255,255.02)]'
        onSubmit={handleSubmit}
      >
        <input
          className='flex h-11 w-full items-center rounded-md border border-neutral-400 px-3 shadow focus-visible:border-transparent'
          disabled={isSending}
          ref={inputRef}
          type='text'
          autoComplete='off'
          name='chats'
          placeholder='Ketik pesan untuk semua orang...'
          onInput={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
          onKeyUp={(ev) => ev.stopPropagation()}
          maxLength={1000}
        />
        <Button
          type='submit'
          className='bg-primary text-primary-foreground border-transparent hover:not-disabled:bg-red-900'
          disabled={isSending}
        >
          <Send className='h-5 w-5' />
        </Button>
      </form>
    </div>
  )
}

export default Chat
