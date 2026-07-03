import type { ClassValue } from 'clsx'
import type { ResponseBase } from '@/feat/Auth/dto'
import { twMerge } from 'tailwind-merge'
import { default as utc } from 'dayjs/plugin/utc'
import { default as timezone } from 'dayjs/plugin/timezone'
import { default as duration } from 'dayjs/plugin/duration'
import { default as customParseFormat } from 'dayjs/plugin/customParseFormat'
import { default as dayjs } from 'dayjs'
import { clsx } from 'clsx'
import { toast } from '@/components/ui/sonner'
import 'dayjs/locale/id'

dayjs.extend(customParseFormat)
dayjs.extend(duration)
dayjs.locale('id')
dayjs.extend(utc)
dayjs.extend(timezone)

export const encoder = new TextEncoder()

export const decoder = new TextDecoder()

export function djs(val?: Parameters<typeof dayjs>[0]) {
  return dayjs(val).tz('Asia/Jakarta')
}

export function encodePassphrase(passphrase: string) {
  return encodeURIComponent(passphrase)
}

export function decodePassphrase(base64String: string) {
  return decodeURIComponent(base64String)
}

export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`
}

export function randomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length

  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export function isLowPowerDevice() {
  return navigator.hardwareConcurrency < 6
}

export function isMeetStaging() {
  return new URL(location.origin).host === 'meet.staging.livekit.io'
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function num(value: unknown) {
  return isNaN(Number(value)) ? 0 : Number(value)
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

export const displayedError = (error: unknown, titleError: string) => {
  const message = error instanceof Error ? error.message : String(error)
  const displayedMessage = message
    ? message
    : 'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman'
  toast.error(titleError, {
    description: displayedMessage,
  })
}

export function qstring<T extends object = object>(
  baseUrl: string,
  obj: T,
  options: {
    encodeValues?: boolean
    encodeKeys?: boolean
    skipNulls?: boolean
    skipEmpty?: boolean
    arrayFormat?: 'brackets' | 'comma' | 'repeat' | 'indices'
  } = {}
): string {
  // Default options
  const {
    encodeValues = true,
    encodeKeys = true,
    skipNulls = false,
    skipEmpty = false,
    arrayFormat = 'brackets',
  } = options

  // Early return for empty objects
  if (
    !obj ||
    typeof obj !== 'object' ||
    Object.keys(obj).length === 0 ||
    (Array.isArray(obj) && obj.length === 0)
  ) {
    return baseUrl
  }

  // Function to encode value based on options
  const encode = (value: string): string => {
    return encodeValues ? encodeURIComponent(value) : value
  }

  // Function to encode key based on options
  const encodeKey = (key: string): string => {
    return encodeKeys ? encodeURIComponent(key) : key
  }

  // Helper function to handle arrays based on arrayFormat option
  const formatArray = (key: string, arr: any[]): string[] => {
    if (arr.length === 0) {
      return [`${encodeKey(key)}=`]
    }

    return arr.map((value) => {
      const encodedValue = value === null || value === undefined ? '' : encode(String(value))

      switch (arrayFormat) {
        case 'brackets':
          return `${encodeKey(key)}[]=${encodedValue}`
        case 'comma':
          return arr.length > 1
            ? `${encodeKey(key)}=${arr.map((v) => (v === null || v === undefined ? '' : encode(String(v)))).join(',')}`
            : `${encodeKey(key)}=${encodedValue}`
        case 'indices':
          return `${encodeKey(key)}[${arr.indexOf(value)}]=${encodedValue}`
        case 'repeat':
        default:
          return `${encodeKey(key)}=${encodedValue}`
      }
    })
  }

  // Process the object into key-value pairs
  const pairs: string[] = []
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, baseUrl.length - 1) : baseUrl

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      // Skip empty string
      if (typeof value === 'string' && !value && skipEmpty) {
        continue
      }

      // Skip null or undefined values if skipNulls is true
      if ((value === null || value === undefined) && skipNulls) {
        continue
      }

      // Handle different value types
      if (Array.isArray(value)) {
        // Handle arrays based on arrayFormat option
        if (arrayFormat === 'comma' && value.length > 0) {
          pairs.push(formatArray(key, value)[0])
        } else {
          pairs.push(...formatArray(key, value))
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects by flattening
        for (const nestedKey in value) {
          if (Object.prototype.hasOwnProperty.call(value, nestedKey)) {
            const nestedValue = value[nestedKey]
            if ((nestedValue === null || nestedValue === undefined) && skipNulls) {
              continue
            }

            const encodedNestedValue =
              nestedValue === null || nestedValue === undefined ? '' : encode(String(nestedValue))
            pairs.push(`${encodeKey(key)}[${encodeKey(nestedKey)}]=${encodedNestedValue}`)
          }
        }
      } else {
        // Handle primitive values
        const encodedValue = value === null || value === undefined ? '' : encode(String(value))
        pairs.push(`${encodeKey(key)}=${encodedValue}`)
      }
    }
  }

  // Join all pairs and prepend with '?'
  return url + (pairs.length > 0 ? `?${pairs.join('&')}` : '')
}

export async function unsecuredCopyToClipboard(text: string): Promise<boolean> {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '0'
  textArea.style.top = '0'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)

  textArea.focus()
  textArea.select()

  let success = false
  try {
    success = document.execCommand('copy')
  } catch (err) {
    console.error('Unable to copy to clipboard', err)
  }
  document.body.removeChild(textArea)
  return success
}

export async function copyHandler(text = '') {
  try {
    await navigator.clipboard.writeText(text)
    return { success: true }
  } catch {
    const success = await unsecuredCopyToClipboard(text)
    return { success }
  }
}

export function loginfo(...data: unknown[]) {
  if (typeof window === 'undefined') return console.log(...data)
  if (!window.location.protocol.startsWith('https')) {
    return console.info(...data)
  }
}

export function createResponseSuccess<T>(data: T): ResponseBase<T> {
  return { data }
}

export function createResponseError<T>(e: unknown, data?: T, fallback = ''): ResponseBase<T> {
  // This will help us debug in development mode.
  // → It's a good habit to log the error only during development
  //   so that production users don’t see raw errors.
  const error = { message: 'Something went wrong, try again later.' }
  const fallbackData = data as T

  if (e instanceof Error) {
    error.message = e.message
  }

  if (fallback) {
    error.message = fallback
  }

  return { data: fallbackData, error }
}
