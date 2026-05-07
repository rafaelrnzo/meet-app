import { useEffect, useMemo, useRef, useState } from 'react'
import { useParticipants, useRoomContext } from '@livekit/components-react'
import { DataPacket_Kind, RoomEvent } from 'livekit-client'
import { getUser } from '@/lib/api/auth-client'
import {
  ChatItem,
  ChatTextPayload,
  ImageMetaPayload,
  ImageChunkPayload,
  ImageDonePayload,
  ChatPinPayload,
  ChatDeletePayload,
  Payload,
  MAX_IMAGE_SIZE,
  CHUNK_SIZE,
} from './types'
import {
  uuid,
  safeParse,
  clampText,
  base64FromUint8,
  uint8FromBase64,
  compressImage,
  publishReliable,
} from './utils'

interface UseChatOptions {
  roomCode: string
  storage?: 'memory' | 'session'
  maxItems?: number
}

export function useChat({ roomCode, storage = 'memory', maxItems = 200 }: UseChatOptions) {
  const room = useRoomContext()
  const participants = useParticipants()

  const [items, setItems] = useState<ChatItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('everyone')
  const [inConversation, setInConversation] = useState(true)
  const [conversations, setConversations] = useState<string[]>([])
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [pinnedMessages, setPinnedMessages] = useState<Record<string, ChatItem | null>>({})
  const [isAdmin, setIsAdmin] = useState(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const itemsRef = useRef<ChatItem[]>(items)

  const me = room?.localParticipant?.identity || 'me'
  const key = useMemo(() => `vc_chat_${roomCode}`, [roomCode])

  const imageBuffers = useRef<
    Map<string, { meta: ImageMetaPayload; chunks: Map<number, Uint8Array> }>
  >(new Map())

  useEffect(() => {
    const u = getUser()
    setIsAdmin(u?.role === 'admin')
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (storage === 'session') {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        const parsed = safeParse<ChatItem[]>(saved)
        if (parsed) setItems(parsed)
      }
    }
    setIsLoaded(true)
  }, [storage, key])

  useEffect(() => {
    if (!isLoaded) return
    if (storage === 'session') {
      const toSave = items.filter((i) => i.type === 'text')
      sessionStorage.setItem(key, JSON.stringify(toSave))
    }
  }, [items, storage, key, isLoaded])

  // receive
  useEffect(() => {
    if (!room) return

    const onData = (payload: Uint8Array, participant?: any, kind?: DataPacket_Kind) => {
      if (kind !== undefined && kind !== DataPacket_Kind.RELIABLE) return

      const text = new TextDecoder().decode(payload)
      const msg = safeParse<Payload>(text)
      if (!msg) return

      // text
      if (msg.type === 'chat') {
        const from = msg.from || participant?.identity || 'unknown'
        setItems((prev) => {
          if (prev.some((x) => x.id === msg.id)) return prev

          let isPrivate = false
          let otherParty = ''

          if (msg.to && msg.to === me) {
            isPrivate = true
            otherParty = from
          }

          if (isPrivate && otherParty) {
            setConversations((prevConvos) => {
              if (!prevConvos.includes(otherParty)) return [...prevConvos, otherParty]
              return prevConvos
            })

            if (activeTab !== otherParty) {
              setUnread((u) => ({ ...u, [otherParty]: (u[otherParty] || 0) + 1 }))
            }
          }

          const next: ChatItem[] = [
            ...prev,
            {
              id: msg.id,
              ts: msg.ts,
              from,
              mine: from === me,
              type: 'text',
              text: msg.text,
              to: msg.to,
            },
          ]
          return next.slice(-maxItems)
        })
        return
      }

      if (msg.type === 'image_meta') {
        imageBuffers.current.set(msg.id, { meta: msg, chunks: new Map() })
        return
      }

      if (msg.type === 'image_chunk') {
        const buf = imageBuffers.current.get(msg.id)
        if (!buf) return
        buf.chunks.set(msg.seq, uint8FromBase64(msg.data))
        return
      }

      if (msg.type === 'image_done') {
        const buf = imageBuffers.current.get(msg.id)
        if (!buf) return

        const ordered = Array.from(buf.chunks.entries())
          .sort((a, b) => a[0] - b[0])
          .map((x) => x[1])

        const blob = new Blob(ordered as BlobPart[], { type: buf.meta.mime })

        setItems((prev) => {
          if (prev.some((x) => x.id === msg.id)) return prev

          if (buf.meta.to && buf.meta.to === me) {
            const sender = buf.meta.from
            setConversations((c) => (c.includes(sender) ? c : [...c, sender]))
            if (activeTab !== sender) {
              setUnread((u) => ({ ...u, [sender]: (u[sender] || 0) + 1 }))
            }
          }

          const next: ChatItem[] = [
            ...prev,
            {
              id: msg.id,
              ts: buf.meta.ts,
              from: buf.meta.from,
              mine: buf.meta.from === me,
              type: 'image',
              blob,
              mime: buf.meta.mime,
              size: buf.meta.size,
              to: buf.meta.to,
            },
          ]
          return next.slice(-maxItems)
        })

        imageBuffers.current.delete(msg.id)
        return
      }

      // pin message
      if (msg.type === 'pin_message') {
        let scope = 'everyone'
        if (msg.to && msg.to === me) {
          scope = msg.from || 'everyone'
        } else if (msg.from === me && msg.to) {
          scope = msg.to
        }

        if (!msg.id) {
          setPinnedMessages((prev) => ({ ...prev, [scope]: null }))
        } else {
          const currentItems = itemsRef.current
          const found = currentItems.find((i) => i.id === msg.id)

          if (found) {
            setPinnedMessages((prev) => ({ ...prev, [scope]: found }))
          } else if (msg.itemText) {
            // Fallback
            const dummy: ChatItem = {
              id: msg.id,
              ts: Date.now(),
              from: 'unknown',
              mine: false,
              type: msg.itemType! || 'text',
              text: msg.itemText || '',
              blob: new Blob(),
              mime: '',
              size: 0,
            }
            setPinnedMessages((prev) => ({ ...prev, [scope]: dummy }))
          }
        }
        return
      }

      // delete message
      if (msg.type === 'delete_message') {
        setItems((prev) => prev.map((i) => (i.id === msg.targetId ? { ...i, isDeleted: true } : i)))

        setPinnedMessages((prev) => {
          const next = { ...prev }
          let changed = false
          Object.entries(next).forEach(([scope, pinned]) => {
            if (pinned?.id === msg.targetId) {
              next[scope] = null
              changed = true
            }
          })
          return changed ? next : prev
        })
        return
      }
    }

    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room, me, maxItems, activeTab])

  const sendText = async (value: string) => {
    if (!room) return
    const t = clampText(value)
    if (!t) return

    const isPrivate = activeTab !== 'everyone'
    const recipient = isPrivate ? activeTab : undefined

    const payload: ChatTextPayload = {
      type: 'chat',
      v: 1,
      id: uuid(),
      ts: Date.now(),
      from: me,
      text: t,
      to: recipient,
    }

    const dest = recipient ? [recipient] : undefined
    await publishReliable(room, payload, dest)

    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        {
          id: payload.id,
          ts: payload.ts,
          from: payload.from,
          mine: true,
          type: 'text',
          text: payload.text,
          to: recipient,
        },
      ]
      return next.slice(-maxItems)
    })
  }

  const sendImageFile = async (file: File) => {
    if (!room) return

    const blob = await compressImage(file)
    if (blob.size > MAX_IMAGE_SIZE) {
      alert('Gambar terlalu besar setelah kompres. Coba gambar lain / kecilkan resolusi.')
      return
    }

    const isPrivate = activeTab !== 'everyone'
    const recipient = isPrivate ? activeTab : undefined

    const id = uuid()
    const meta: ImageMetaPayload = {
      type: 'image_meta',
      v: 1,
      id,
      ts: Date.now(),
      from: me,
      mime: blob.type || 'image/webp',
      size: blob.size,
      to: recipient,
    }

    const dest = recipient ? [recipient] : undefined
    await publishReliable(room, meta, dest)

    const buf = new Uint8Array(await blob.arrayBuffer())
    let seq = 0

    for (let i = 0; i < buf.length; i += CHUNK_SIZE) {
      const chunk = buf.slice(i, i + CHUNK_SIZE)
      const payload: ImageChunkPayload = {
        type: 'image_chunk',
        v: 1,
        id,
        seq,
        data: base64FromUint8(chunk),
      }
      await publishReliable(room, payload, dest)
      seq++
    }

    const done: ImageDonePayload = { type: 'image_done', v: 1, id }
    await publishReliable(room, done, dest)

    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        {
          id,
          ts: meta.ts,
          from: me,
          mine: true,
          type: 'image',
          blob,
          mime: meta.mime,
          size: meta.size,
          to: recipient,
        },
      ]
      return next.slice(-maxItems)
    })
  }

  const handleDelete = async (id: string, fromIdentity: string) => {
    if (!isAdmin && fromIdentity !== me) {
      alert('You can only delete your own messages.')
      return
    }

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isDeleted: true } : i)))

    const activePin = pinnedMessages[activeTab]
    if (activePin?.id === id) {
      setPinnedMessages((p) => ({ ...p, [activeTab]: null }))
    }

    if (!room) return
    const payload: ChatDeletePayload = {
      type: 'delete_message',
      v: 1,
      targetId: id,
    }
    await publishReliable(room, payload)
  }

  const handlePin = async (item: ChatItem) => {
    if (!isAdmin) return

    const scope = activeTab

    setPinnedMessages((p) => ({ ...p, [scope]: item }))

    if (!room) return
    const payload: ChatPinPayload = {
      type: 'pin_message',
      v: 1,
      id: item.id,
      itemText: item.type === 'text' ? item.text : '',
      itemType: item.type,
    }

    const dest = scope === 'everyone' ? undefined : [scope]
    const fullPayload = { ...payload, to: scope === 'everyone' ? undefined : scope }

    await publishReliable(room, fullPayload, dest)
  }

  const handleUnpin = async () => {
    if (!isAdmin) return

    const scope = activeTab
    // Optimistic
    setPinnedMessages((p) => ({ ...p, [scope]: null }))

    if (!room) return
    const payload: ChatPinPayload = {
      type: 'pin_message',
      v: 1,
      id: '', // empty id means unpin
    }

    const dest = scope === 'everyone' ? undefined : [scope]
    const fullPayload = { ...payload, to: scope === 'everyone' ? undefined : scope }

    await publishReliable(room, fullPayload, dest)
  }

  // Switch to specific chat
  const openChat = (identity: string) => {
    setActiveTab(identity)
    setInConversation(true)
    // clear unread
    setUnread((prev) => {
      const u = { ...prev }
      delete u[identity]
      return u
    })
    // Add to conversations if not present
    if (identity !== 'everyone' && !conversations.includes(identity)) {
      setConversations((p) => [...p, identity])
    }
  }

  return {
    items,
    activeTab,
    inConversation,
    setInConversation,
    conversations,
    setConversations,
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
  }
}
