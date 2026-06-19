import type { Room } from 'livekit-client'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { ConnectionState, RoomEvent } from 'livekit-client'
import {
  publishChunked,
  decodeChunkHeader,
  decodeMessage,
  encodeMessage,
  generateColor,
} from '@/feat/helpers'
import { LiveKitKey, MessageType } from '@/feat/enum'

export interface TLDrawCursor {
  x: number
  y: number
}

export interface ProseMirrorCursor {
  anchor: number
  head: number
}

export interface AwarenessState<T extends object = TLDrawCursor> {
  name: string
  cursor: T | null
  color: { hex: string; tldraw: string }
}

export class LiveKitYjsProvider<T extends object = TLDrawCursor> {
  doc: Y.Doc
  room: Room
  awareness: Awareness

  private _chunkBuffer = new Map<string, (Uint8Array | null)[]>()
  private _cleanupInterval: ReturnType<typeof setInterval>

  private _handleUpdate: (update: Uint8Array, origin: unknown) => void
  private _handleAwareness: (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => void
  private _handleDataReceived: (
    payload: Uint8Array,
    participant: unknown,
    kind: unknown,
    topic?: string
  ) => void

  constructor(doc: Y.Doc, room: Room) {
    this.doc = doc
    this.room = room
    this.awareness = new Awareness(doc)

    this.awareness.setLocalState({
      cursor: null,
      name: room.localParticipant.name ?? room.localParticipant.identity,
      color: generateColor(room.localParticipant.identity),
    } satisfies AwarenessState<T>)

    this._handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === this) return
      const msg = encodeMessage(update, MessageType.Update)
      publishChunked(room.localParticipant, msg, {
        reliable: true,
        topic: LiveKitKey.YJSDoc,
      }).catch(console.error)
    }

    this._handleAwareness = (_, origin) => {
      if (origin === 'local') {
        const state = this.awareness.getLocalState() as AwarenessState<T>
        const payload = new TextEncoder().encode(
          JSON.stringify({ clientId: this.awareness.clientID, state })
        )
        room.localParticipant
          .publishData(payload, { reliable: false, topic: LiveKitKey.YJSAwareness })
          .catch(console.error)
      }
    }

    this._handleDataReceived = (payload, _participant, _kind, topic) => {
      if (topic === LiveKitKey.YJSDoc) {
        // Reassemble before processing
        const complete = this._reassemble(payload)
        if (!complete) return

        try {
          const decoded = decodeMessage(complete)
          if (!decoded) return
          const { type, data } = decoded

          if (type === MessageType.Update) {
            Y.applyUpdate(this.doc, data, this)
          } else if (type === MessageType.StateVector) {
            const diff = Y.encodeStateAsUpdate(this.doc, data)
            if (diff.byteLength > 2) {
              const msg = encodeMessage(diff, MessageType.Update)
              publishChunked(room.localParticipant, msg, {
                reliable: true,
                topic: LiveKitKey.YJSDoc,
              }).catch(console.error)
            }
          }
        } catch (e) {
          console.log('Failed to apply ydoc update:', e)
        }

        return
      }

      if (topic === LiveKitKey.YJSAwareness) {
        try {
          const { clientId, state } = JSON.parse(new TextDecoder().decode(payload)) as {
            clientId: number
            state: AwarenessState<T>
          }
          this.awareness.getStates().set(clientId, state)
          this.awareness.emit('change', [{ added: [], updated: [clientId], removed: [] }, 'remote'])
        } catch (e) {
          console.log('Failed to emit awareness:', e)
        }

        return
      }
    }

    doc.on('update', this._handleUpdate)
    this.awareness.on('change', this._handleAwareness)
    room.on(RoomEvent.DataReceived, this._handleDataReceived)

    // Clean up stale chunks every 30 seconds (handle packet loss edge case)
    this._cleanupInterval = setInterval(() => this._chunkBuffer.clear(), 30_000)
    this._requestInitialState()
  }

  private _reassemble(data: Uint8Array): Uint8Array | null {
    const header = decodeChunkHeader(data)

    // Not chunked — return as-is
    if (!header) return data

    const { msgId, index, total, payload } = header

    if (!this._chunkBuffer.has(msgId)) {
       
      this._chunkBuffer.set(msgId, new Array(total).fill(null))
    }

    const chunks = this._chunkBuffer.get(msgId)!
    chunks[index] = payload

    if (chunks.every(Boolean)) {
      this._chunkBuffer.delete(msgId)
      const totalBytes = chunks.reduce((sum, c) => sum + c!.byteLength, 0)
      const result = new Uint8Array(totalBytes)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk!, offset)
        offset += chunk!.byteLength
      }
      return result
    }

    return null
  }

  private _requestInitialState() {
    if (this.room.state !== ConnectionState.Connected) return
    const stateVector = Y.encodeStateVector(this.doc)
    const msg = encodeMessage(stateVector, MessageType.StateVector)
    publishChunked(this.room.localParticipant, msg, {
      reliable: true,
      topic: LiveKitKey.YJSDoc,
    }).catch(console.error)
  }

  destroy() {
    clearInterval(this._cleanupInterval)
    this._chunkBuffer.clear()
    this.doc.off('update', this._handleUpdate)
    this.awareness.off('change', this._handleAwareness)
    this.awareness.destroy()
    this.room.off(RoomEvent.DataReceived, this._handleDataReceived)
  }
}
