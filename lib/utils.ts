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
