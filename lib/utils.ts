import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { toast } from '@/components/ui/sonner'

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

// eslint-disable-next-line @typescript-eslint/require-await
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
