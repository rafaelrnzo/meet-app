'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, Copy, MessageSquare, Pin, Plus, Trash2, User, X } from 'lucide-react'

import { useChat } from './useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatItem } from './types'

export function MeetingChat({
  roomCode,
  storage = 'memory',
  maxItems = 200,
  onClose,
}: {
  roomCode: string
  storage?: 'memory' | 'session'
  maxItems?: number
  onClose?: () => void
}) {
  const {
    items,
    activeTab,
    inConversation,
    setInConversation,
    conversations,
    unread,
    pinnedMessages,
    isAdmin,
    me,
    sendText,
    sendImageFile,
    handleDelete,
    handlePin,
    handleUnpin,
    openChat,
    participants,
  } = useChat({ roomCode, storage, maxItems })

  const [isOpen, setIsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ChatItem } | null>(
    null
  )

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items.length, pinnedMessages])

  useEffect(() => {
    const fn = () => setContextMenu(null)
    window.addEventListener('click', fn)
    return () => window.removeEventListener('click', fn)
  }, [])

  // Filter items for view
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (activeTab === 'everyone') {
        return !i.to
      }
      if (i.mine && i.to === activeTab) return true
      if (!i.mine && i.from === activeTab && i.to === me) return true
      return false
    })
  }, [items, activeTab, me])

  const activeParticipantName = useMemo(() => {
    if (activeTab === 'everyone') return 'Everyone'
    const p = participants.find((x) => x.identity === activeTab)
    return p?.name || activeTab
  }, [activeTab, participants])

  const availableUsers = useMemo(() => {
    return participants.filter((p) => p.identity !== me && !conversations.includes(p.identity))
  }, [participants, conversations, me])

  // Scroll to message
  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-primary/20', 'transition-colors', 'duration-1000')
      setTimeout(() => el.classList.remove('bg-primary/20'), 2000)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, item: ChatItem) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({ x: rect.left, y: rect.bottom + 5, item })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setContextMenu(null)
  }

  const handleMenuDelete = () => {
    if (contextMenu) {
      handleDelete(contextMenu.item.id, contextMenu.item.from)
    }
  }

  const handleMenuPin = () => {
    if (contextMenu) {
      handlePin(contextMenu.item)
    }
  }

  return (
    <div className='bg-card/80 flex h-full w-full flex-col backdrop-blur-sm'>
      {/* Header */}
      <div className='border-border bg-muted/50 flex h-14 items-center justify-between border-b px-4 py-3'>
        <div className='flex items-center gap-2 overflow-hidden'>
          {!inConversation ? (
            <span className='text-foreground text-sm font-semibold'>Messages</span>
          ) : (
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setInConversation(false)}
                className='hover:bg-muted-foreground/10 mr-1 rounded p-1'
                title='Back to list'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>
              <div className='flex flex-col leading-none'>
                <span className='text-foreground max-w-[150px] truncate text-sm font-semibold'>
                  {activeParticipantName}
                </span>
                {activeTab !== 'everyone' && (
                  <span className='text-muted-foreground text-[10px]'>Private Chat</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {/* If in list view, show add button */}
          {!inConversation && (
            <div className='relative'>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className='hover:bg-muted-foreground/10 border-border rounded-full border p-1.5'
                title='New Chat'
              >
                <Plus className='h-4 w-4' />
              </button>
              {isOpen && (
                <div className='bg-popover border-border absolute top-8 right-0 z-10 max-h-48 w-40 overflow-auto rounded-md border py-1 shadow-md'>
                  {availableUsers.length === 0 ? (
                    <div className='text-muted-foreground px-3 py-2 text-xs'>No other users</div>
                  ) : (
                    availableUsers.map((u) => (
                      <button
                        key={u.identity}
                        className='hover:bg-muted text-foreground w-full px-3 py-2 text-left text-sm transition-colors'
                        onClick={() => {
                          openChat(u.identity)
                          setIsOpen(false)
                        }}
                      >
                        {u.name || u.identity}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className='text-muted-foreground hover:text-foreground border-border hover:bg-muted rounded-md border px-2 py-1 text-xs transition-colors'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!inConversation ? (
        // LIST VIEW
        <div className='flex-1 overflow-y-auto'>
          <button
            onClick={() => openChat('everyone')}
            className={`border-border/40 hover:bg-muted/30 group flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors ${activeTab === 'everyone' ? 'bg-muted/50' : ''}`}
          >
            <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full'>
              <MessageSquare className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-foreground text-sm font-medium'>Everyone</div>
              <div className='text-muted-foreground truncate text-xs'>Public room chat</div>
            </div>
            <ChevronLeft className='text-muted-foreground h-4 w-4 rotate-180 opacity-0 transition-opacity group-hover:opacity-100' />
          </button>

          {conversations.map((cId) => {
            const p = participants.find((x) => x.identity === cId)
            const name = p?.name || cId
            const count = unread[cId] || 0
            return (
              <button
                key={cId}
                onClick={() => openChat(cId)}
                className={`border-border/40 hover:bg-muted/30 group flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors`}
              >
                <div className='bg-secondary text-secondary-foreground flex h-10 w-10 items-center justify-center rounded-full'>
                  <User className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-foreground truncate text-sm font-medium'>{name}</span>
                    {count > 0 && (
                      <span className='bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold'>
                        {count}
                      </span>
                    )}
                  </div>
                  <div className='text-muted-foreground truncate text-xs'>Private conversation</div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        // CHAT VIEW
        <>
          {pinnedMessages[activeTab] && (
            <div className='bg-primary/5 border-primary/20 sticky top-0 z-10 flex items-center justify-between border-b px-3 py-2 backdrop-blur-md'>
              <div
                className='flex flex-1 cursor-pointer flex-col'
                onClick={() => scrollToMessage(pinnedMessages[activeTab]!.id)}
              >
                <div className='text-primary flex items-center gap-1 text-[10px] font-bold'>
                  <Pin className='h-3 w-3' /> Pinned Message
                </div>
                <div className='text-foreground/80 max-w-[200px] truncate text-xs'>
                  {pinnedMessages[activeTab].type === 'text'
                    ? (pinnedMessages[activeTab] as any).text
                    : '📷 Image'}
                </div>
              </div>
              {isAdmin && (
                <button onClick={handleUnpin} className='rounded p-1 hover:bg-black/5'>
                  <X className='text-muted-foreground h-4 w-4' />
                </button>
              )}
            </div>
          )}

          <div className='relative min-h-0 flex-1 space-y-2 overflow-y-auto p-3'>
            {filteredItems.length === 0 ? (
              <div className='text-muted-foreground py-6 text-center text-xs'>
                {activeTab === 'everyone' ? 'No messages yet.' : 'Start a private conversation.'}
              </div>
            ) : (
              filteredItems.map((m) => (
                <ChatMessage
                  key={m.id}
                  m={m}
                  activeTab={activeTab}
                  onContextMenu={handleContextMenu}
                />
              ))
            )}
            <div ref={endRef} />
          </div>

          <ChatInput
            activeParticipantName={activeParticipantName}
            onSendText={sendText}
            onSendImage={sendImageFile}
          />
        </>
      )}

      {/* Context Menu */}
      {contextMenu &&
        mounted &&
        createPortal(
          <div
            className='bg-popover border-border text-popover-foreground fixed z-[9999] flex min-w-[120px] flex-col gap-0.5 overflow-hidden rounded-md border p-1 shadow-md'
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {isAdmin && (
              <button
                onClick={handleMenuPin}
                className='hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs'
              >
                <Pin className='h-3.5 w-3.5' />{' '}
                {pinnedMessages[activeTab]?.id === contextMenu.item.id ? 'Unpin' : 'Pin'}
              </button>
            )}
            {contextMenu.item.type === 'text' && (
              <button
                onClick={() =>
                  handleCopy(contextMenu.item.type === 'text' ? contextMenu.item.text : '')
                }
                className='hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs'
              >
                <Copy className='h-3.5 w-3.5' /> Copy
              </button>
            )}
            <div className='bg-border my-0.5 h-px' />
            <button
              onClick={handleMenuDelete}
              className='hover:bg-destructive/10 text-destructive flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs'
            >
              <Trash2 className='h-3.5 w-3.5' /> Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  )
}
