import { DataPacket_Kind } from 'livekit-client'

export function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function safeParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

export function clampText(s: string, max = 2000) {
  const t = s.trim()
  return t.length > max ? t.slice(0, max) : t
}

export function base64FromUint8(u8: Uint8Array) {
  let bin = ''
  const step = 0x8000
  for (let i = 0; i < u8.length; i += step) {
    bin += String.fromCharCode(...u8.subarray(i, i + step))
  }
  return btoa(bin)
}

export function uint8FromBase64(b64: string) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function compressImage(file: File): Promise<Blob> {
  const img = document.createElement('img')
  img.src = URL.createObjectURL(file)

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load image'))
  })

  const maxW = 1280
  const scale = Math.min(1, maxW / img.width)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/webp', 0.8)
  })

  return blob
}

export async function publishReliable(room: any, obj: any, to?: string[]) {
  if (!room) return
  if (room.state !== 'connected') return

  const bytes = new TextEncoder().encode(JSON.stringify(obj))

  try {
    await room.localParticipant.publishData(bytes, { reliable: true, destinationIdentities: to })
  } catch (e) {
    try {
      await room.localParticipant.publishData(bytes, DataPacket_Kind.RELIABLE, to)
    } catch (e2) {
      console.error('Failed to publish data', e, e2)
    }
  }
}
