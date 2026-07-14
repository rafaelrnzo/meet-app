import type { ReactNode } from 'react'
import type { LocalParticipant, VideoCodec } from 'livekit-client'
import type { ParticipantAttributes } from '@/hooks/use-tabs-participant'
import type { MessageType } from '@/feat/enum'
import type { ParticipantStatus } from './types'
import { isValidElement, Children, cloneElement } from 'react'
import { videoCodecs } from 'livekit-client'
import { cn } from '@/lib/utils'
import { ScreenCode } from '@/feat/enum'
import { ChunkSize, ColorPalette } from '@/feat/const'

export function roomOptionsStringifyReplacer(key: string, val: unknown) {
  if (key === 'processor' && val && typeof val === 'object' && 'name' in val) {
    return val.name
  }
  if ((key === 'e2ee' || key === 'encryption') && val) {
    return 'e2ee-enabled'
  }
  return val
}

export function getLiveKitURL(projectUrl: string, region: string | null): string {
  const url = new URL(projectUrl)

  if (region && url.hostname.includes('livekit.cloud')) {
    let [projectId, ...hostParts] = url.hostname.split('.')

    if (hostParts[0] !== 'staging') {
      hostParts = ['production', ...hostParts]
    }

    url.hostname = [projectId, region, ...hostParts].join('.')
  }

  return url.toString()
}

export function isVideoCodec(codec?: string): codec is VideoCodec {
  return !!codec && videoCodecs.includes(codec as VideoCodec)
}

export function parseYoutubeURL(url?: string) {
  if (!url) return { match: false, youtubeVideoID: '' }

  // Accept full YouTube URL or bare video ID
  const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&?/]+)/.exec(url.trim())
  const youtubeVideoID = match?.[1] ?? url.trim()

  return { match: !!match?.[1], youtubeVideoID }
}

export async function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  document.body.appendChild(textArea)

  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } catch (e) {
    console.log('Failed to copy to clipboard using copy command:', e)
  }

  document.body.removeChild(textArea)
}

export async function copyHandler(text = '') {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    await unsecuredCopyToClipboard(text)
    console.log('Failed to copy to clipboard with secure https:', e)
  }
}

export function formatCountdown(counter: number) {
  const minutes = Math.floor(counter / 60)
  const seconds = counter % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// ── Chunking ──────────────────────────────────────────────────────────────────
// Header: [0xFF marker][6 bytes msgId][2 bytes index][2 bytes total] = 11 bytes

export function encodeChunkHeader(msgId: string, index: number, total: number): Uint8Array {
  const buf = new Uint8Array(11)
  const view = new DataView(buf.buffer)
  buf[0] = 0xff
  for (let i = 0; i < 6; i++) buf[1 + i] = msgId.charCodeAt(i) || 0
  view.setUint16(7, index)
  view.setUint16(9, total)
  return buf
}

export function decodeChunkHeader(
  data: Uint8Array
): { msgId: string; index: number; total: number; payload: Uint8Array } | null {
  if (data[0] !== 0xff || data.byteLength < 11) return null
  const view = new DataView(data.buffer, data.byteOffset)
  return {
    msgId: String.fromCharCode(...data.slice(1, 7)).replace(/\0/g, ''),
    index: view.getUint16(7),
    total: view.getUint16(9),
    payload: data.slice(11),
  }
}

export async function publishChunked(
  participant: LocalParticipant,
  data: Uint8Array,
  options: { reliable: boolean; topic: string }
) {
  if (data.byteLength <= ChunkSize) {
    await participant.publishData(data as never, options)
    return
  }

  const totalChunks = Math.ceil(data.byteLength / ChunkSize)
  const msgId = Math.random().toString(36).slice(2, 8).padEnd(6, '0')

  for (let i = 0; i < totalChunks; i++) {
    const chunk = data.slice(i * ChunkSize, (i + 1) * ChunkSize)
    const header = encodeChunkHeader(msgId, i, totalChunks)
    const packet = new Uint8Array(header.byteLength + chunk.byteLength)
    packet.set(header, 0)
    packet.set(chunk, header.byteLength)
    await participant.publishData(packet, options)
  }
}

// ── RTCHandler ───────────────────────────────────────────────────────────────────

export function encodeMessage(payload: Uint8Array, type: MessageType): Uint8Array {
  const out = new Uint8Array(1 + payload.byteLength)
  out[0] = type
  out.set(payload, 1)
  return out
}

export function decodeMessage(raw: Uint8Array) {
  if (raw.byteLength < 2) return null
  return { type: raw[0], data: raw.slice(1) }
}

export function generateColor(identity: string): { hex: string; tldraw: string } {
  let hash = 0
  for (let i = 0; i < identity.length; i++) {
    hash = identity.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ColorPalette[Math.abs(hash) % ColorPalette.length]
}

export function cloneSingleChild(
  children: ReactNode | ReactNode[],
  props?: Record<string, any>,
  key?: any
) {
  return Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if (isValidElement(child) && Children.only(children)) {
      const _props = child.props as any
      if (_props.className) {
        // make sure we retain classnames of both passed props and child
        props ??= {}
        props.className = cn(_props.className, props.className)
        props.style = { ..._props.style, ...props.style }
      }
      return cloneElement(child, { ...props, key })
    }
    return child
  })
}

export const getParticipantStatus = (
  isSpeaking: boolean,
  attributes?: ParticipantAttributes,
  mode: 'arrayString' | 'object' = 'object'
): string[] | ParticipantStatus => {
  if (!attributes) return []

  if (mode === 'arrayString') {
    return [
      isSpeaking && 'Sedang berbicara',
      attributes.SCREEN_ACTIVE === ScreenCode.Recording.toString() && 'Sedang merekam',
      attributes.SCREEN_ACTIVE === ScreenCode.Whiteboard.toString() &&
        'Sedang menampilkan papan tulis',
      attributes.SCREEN_ACTIVE === ScreenCode.Presentation.toString() && 'Sedang presentasi',
      attributes.SCREEN_ACTIVE === ScreenCode.WatchYoutube.toString() && 'Sedang menonton YouTube',

      String(attributes.HAND_RAISED) === 'true' && 'Sedang mengangkat tangan',
    ].filter(Boolean) as string[]
  } else {
    return {
      isSpeaking,
      isRecording: attributes.SCREEN_ACTIVE === ScreenCode.Recording.toString(),
      isWhiteboard: attributes.SCREEN_ACTIVE === ScreenCode.Whiteboard.toString(),
      isPresentation: attributes.SCREEN_ACTIVE === ScreenCode.Presentation.toString(),
      isWatchYoutube: attributes.SCREEN_ACTIVE === ScreenCode.WatchYoutube.toString(),
      isHandRaised: String(attributes.HAND_RAISED) === 'true',
    } satisfies ParticipantStatus
  }
}
