import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import duration from 'dayjs/plugin/duration'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

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
