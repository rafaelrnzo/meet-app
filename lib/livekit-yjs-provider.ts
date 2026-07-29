import type { RemoteParticipant, Room, DataPacket_Kind } from 'livekit-client'
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

/**
 * Awareness state shape expected by @mizuka-wu/y-excalidraw's ExcalidrawBinding.
 * The binding manages `pointer`, `button` and `selectedElementIds` on its own —
 * we only need to seed `user` so remote peers can render our name/color.
 */
export interface ExcalidrawUser {
  name: string
  color: string
}

export interface AwarenessState {
  user: ExcalidrawUser
  [key: string]: unknown
}

/**
 * Lightweight JSON envelope for the awareness data channel.
 * 'sync-request' is broadcast by a peer that just (re)connected and wants
 * everyone's current state. 'state' carries one peer's awareness snapshot
 * (or `null` when that peer is going away / clearing its cursor).
 */
type AwarenessMessage =
  { kind: 'sync-request' } | { kind: 'state'; clientId: number; state: AwarenessState | null }

interface PublishOptions {
  reliable: boolean
  topic: string
  destinationIdentities?: string[]
}

export class LiveKitYjsProvider {
  doc: Y.Doc
  room: Room
  awareness: Awareness

  private _chunkBuffer = new Map<string, (Uint8Array | null)[]>()
  private _cleanupInterval: ReturnType<typeof setInterval>
  private _participantAwareness = new Map<string, number>()
  private _destroyed = false

  private _handleDocUpdate: (update: Uint8Array, origin: unknown) => void
  private _handleAwarenessUpdate: (
    changes: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => void
  private _handleDataReceived: (
    payload: Uint8Array,
    participant?: RemoteParticipant,
    kind?: DataPacket_Kind,
    topic?: string
  ) => void
  private _handleParticipantConnected: (participant: RemoteParticipant) => void
  private _handleParticipantDisconnected: (participant: RemoteParticipant) => void
  private _handleReconnected: () => void

  constructor(doc: Y.Doc, room: Room) {
    this.doc = doc
    this.room = room
    this.awareness = new Awareness(doc)

    this.awareness.setLocalState({
      user: {
        name: room.localParticipant.name ?? room.localParticipant.identity,
        color: generateColor(room.localParticipant.identity).hex,
      },
    } satisfies AwarenessState)

    // ---- Y.Doc local update -> LiveKit ----
    this._handleDocUpdate = (update, origin) => {
      if (origin === this) return // ignore updates we just applied ourselves
      const msg = encodeMessage(update, MessageType.Update)
      this._publishDoc(msg, { reliable: true, topic: LiveKitKey.YJSDoc })
    }

    // ---- Awareness local update -> LiveKit ----
    // `update` (not `change`) fires on every local setLocalState/-Field call,
    // which is what we want to broadcast.
    this._handleAwarenessUpdate = (_changes, origin) => {
      if (origin !== 'local') return
      const state = this.awareness.getLocalState() as AwarenessState | null
      this._broadcastAwarenessState(state)
    }

    // ---- Inbound LiveKit data ----
    this._handleDataReceived = (payload, participant, _kind, topic) => {
      if (topic === LiveKitKey.YJSDoc) {
        this._onDocData(payload, participant)
        return
      }
      if (topic === LiveKitKey.YJSAwareness) {
        this._onAwarenessData(payload, participant)
        return
      }
    }

    // A new peer joined the room: hand them our current cursor state right
    // away instead of waiting for their sync-request to round-trip.
    this._handleParticipantConnected = (participant) => {
      const state = this.awareness.getLocalState() as AwarenessState | null
      if (!state) return
      this._publishAwareness(
        { kind: 'state', clientId: this.awareness.clientID, state },
        { destinationIdentities: [participant.identity] }
      )
    }

    this._handleParticipantDisconnected = (participant) => {
      const clientId = this._participantAwareness.get(participant.identity)
      if (clientId == null) return

      this._participantAwareness.delete(participant.identity)
      this.awareness.getStates().delete(clientId)
      this.awareness.emit('change', [{ added: [], updated: [], removed: [clientId] }, 'remote'])
    }

    // Reconnects can drop buffered chunks / miss updates entirely — resync
    // both channels once we're back.
    this._handleReconnected = () => {
      this._requestDocSync()
      this._requestAwarenessSync()
    }

    doc.on('update', this._handleDocUpdate)
    this.awareness.on('update', this._handleAwarenessUpdate)
    room.on(RoomEvent.DataReceived, this._handleDataReceived)
    room.on(RoomEvent.ParticipantConnected, this._handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, this._handleParticipantDisconnected)
    room.on(RoomEvent.Reconnected, this._handleReconnected)

    // Clean up stale chunk fragments periodically (handles packet loss where
    // a chunk never fully arrives).
    this._cleanupInterval = setInterval(() => this._chunkBuffer.clear(), 30_000)

    // Kick off the initial sync once we're actually connected — the
    // constructor can run before the room finishes connecting, and firing
    // publishData too early silently drops the message with no retry.
    if (room.state === ConnectionState.Connected) {
      this._requestDocSync()
      this._requestAwarenessSync()
    } else {
      room.once(RoomEvent.Connected, () => {
        this._requestDocSync()
        this._requestAwarenessSync()
      })
    }
  }

  // ---------------- Y.Doc sync ----------------

  private _onDocData(payload: Uint8Array, participant?: RemoteParticipant) {
    const complete = this._reassemble(payload)
    if (!complete) return

    try {
      const decoded = decodeMessage(complete)
      if (!decoded) return
      const { type, data } = decoded

      if (type === MessageType.Update) {
        Y.applyUpdate(this.doc, data, this)
        return
      }

      if (type === MessageType.StateVector) {
        const diff = Y.encodeStateAsUpdate(this.doc, data)
        if (diff.byteLength <= 2) return // nothing new for them
        const msg = encodeMessage(diff, MessageType.Update)
        // Reply directly to whoever asked instead of broadcasting the diff
        // to the whole room.
        this._publishDoc(msg, {
          reliable: true,
          topic: LiveKitKey.YJSDoc,
          destinationIdentities: participant ? [participant.identity] : undefined,
        })
      }
    } catch (e) {
      console.log('Failed to apply ydoc update:', e)
    }
  }

  private _requestDocSync() {
    const stateVector = Y.encodeStateVector(this.doc)
    const msg = encodeMessage(stateVector, MessageType.StateVector)
    this._publishDoc(msg, { reliable: true, topic: LiveKitKey.YJSDoc })
  }

  private _reassemble(data: Uint8Array): Uint8Array | null {
    const header = decodeChunkHeader(data)
    if (!header) return data // not chunked

    const { msgId, index, total, payload } = header

    if (!this._chunkBuffer.has(msgId)) {
      this._chunkBuffer.set(msgId, new Array(total).fill(null))
    }

    const chunks = this._chunkBuffer.get(msgId)!
    chunks[index] = payload

    if (!chunks.every(Boolean)) return null

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

  // ---------------- Awareness sync ----------------

  private _onAwarenessData(payload: Uint8Array, participant?: RemoteParticipant) {
    try {
      const msg = JSON.parse(new TextDecoder().decode(payload)) as AwarenessMessage

      if (msg.kind === 'sync-request') {
        // Someone (re)joined and wants everyone's current state — reply
        // directly to them instead of broadcasting to the whole room.
        const state = this.awareness.getLocalState() as AwarenessState | null
        if (state && participant) {
          this._publishAwareness(
            { kind: 'state', clientId: this.awareness.clientID, state },
            { destinationIdentities: [participant.identity] }
          )
        }
        return
      }

      if (msg.kind === 'state') {
        const { clientId, state } = msg
        if (participant) this._participantAwareness.set(participant.identity, clientId)

        if (state === null) {
          this.awareness.getStates().delete(clientId)
          this.awareness.emit('change', [{ added: [], updated: [], removed: [clientId] }, 'remote'])
          return
        }

        const isNew = !this.awareness.getStates().has(clientId)
        this.awareness.getStates().set(clientId, state)
        this.awareness.emit('change', [
          isNew
            ? { added: [clientId], updated: [], removed: [] }
            : { added: [], updated: [clientId], removed: [] },
          'remote',
        ])
      }
    } catch (e) {
      console.log('Failed to process awareness message:', e)
    }
  }

  private _broadcastAwarenessState(state: AwarenessState | null) {
    this._publishAwareness(
      { kind: 'state', clientId: this.awareness.clientID, state },
      { reliable: false }
    )
  }

  private _requestAwarenessSync() {
    this._publishAwareness({ kind: 'sync-request' }, { reliable: true })
  }

  // ---------------- Transport ----------------

  private _publishDoc(msg: Uint8Array, options: PublishOptions) {
    if (this.room.state !== ConnectionState.Connected) return
    publishChunked(this.room.localParticipant, msg, options).catch(console.log)
  }

  /** Awareness payloads are always small JSON — no chunking needed. */
  private _publishAwareness(
    message: AwarenessMessage,
    options: { reliable?: boolean; destinationIdentities?: string[] } = {}
  ) {
    if (this.room.state !== ConnectionState.Connected) return
    const payload = new TextEncoder().encode(JSON.stringify(message))
    this.room.localParticipant
      .publishData(payload, {
        reliable: options.reliable ?? true,
        topic: LiveKitKey.YJSAwareness,
        destinationIdentities: options.destinationIdentities,
      })
      .catch((error: unknown) => {
        // Suppress expected abort errors during disconnect/channel teardown
        const isAbort =
          error instanceof Error &&
          (error.message.includes('User-Initiated Abort') || error.name === 'AbortError')
        if (!isAbort) console.warn('Failed to publish awareness:', error)
      })
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true

    // Only broadcast cursor-clear if the data channel is still open.
    // During disconnect, the lossy channel closes before room.state updates,
    // which causes "User-Initiated Abort" errors on unreliable sends.
    const isChannelOpen =
      this.room.state === ConnectionState.Connected &&
      // @ts-expect-error: engine is internal but stable across livekit-client versions
      this.room.engine?.publisher?.dc?.readyState === 'open'

    if (isChannelOpen) {
      this._broadcastAwarenessState(null)
    }

    clearInterval(this._cleanupInterval)
    this._chunkBuffer.clear()

    this.doc.off('update', this._handleDocUpdate)
    this.awareness.off('update', this._handleAwarenessUpdate)
    this.awareness.destroy()

    this.room.off(RoomEvent.DataReceived, this._handleDataReceived)
    this.room.off(RoomEvent.ParticipantConnected, this._handleParticipantConnected)
    this.room.off(RoomEvent.ParticipantDisconnected, this._handleParticipantDisconnected)
    this.room.off(RoomEvent.Reconnected, this._handleReconnected)
  }
}
