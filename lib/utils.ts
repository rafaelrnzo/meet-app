import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { toast } from '@/components/ui/sonner'
import { defaultErrorMessage } from '@/config'

dayjs.extend(customParseFormat)
dayjs.extend(duration)
dayjs.locale('id')

export const djs = dayjs

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function without<T extends object, K extends keyof T>(obj: T, keys: K[]) {
  const clone = { ...obj }
  for (const key of keys) {
    delete clone[key]
  }
  return clone
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return without(obj, keys)
}

export function formatFileSize(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  document.body.appendChild(textArea)

  textArea.focus()
  textArea.select()

  document.execCommand('copy')
  document.body.removeChild(textArea)
}

export async function copyToClipboardHandler(
  textToCopy: string,
  options?: { silent?: boolean }
): Promise<{ error?: string } | undefined> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy)
    } else {
      unsecuredCopyToClipboard(textToCopy)
    }
  } catch {
    if (!options?.silent) {
      toast.error('Gagal salin kode', { description: defaultErrorMessage })
    }
    return { error: 'Gagal salin kode' }
  }
}

export async function shareLinkHandler(
  data: ShareData & Required<Pick<ShareData, 'url'>>
): Promise<{ error?: string } | undefined> {
  try {
    let isShare = false
    if (navigator.canShare?.(data)) {
      await navigator.share(data)
      isShare = true
    }
    const response = await copyToClipboardHandler(data.url, { silent: true })
    if (!isShare && response?.error) throw Error()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    toast.error('Gagal bagikan kode', { description: defaultErrorMessage })
    return { error: 'Gagal bagikan kode' }
  }
}

export const displayedError = (error: unknown, titleError: string) => {
  const message = error instanceof Error ? error.message : String(error)
  const displayedMessage = message
    ? message
    : 'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman'
  toast.error(titleError, {
    description: displayedMessage,
  })
}
