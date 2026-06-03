import { cn } from '@/lib/utils'

export const ICON_NAMES = [
  'home',
  'video',
  'shield-half',
  'gift',
  'users',
  'play-circle',
  'logout',
  'close',
  'search',
  'filter',
  'calendar',
  'copy',
  'arrow-clockwise',
  'share',
  'grid',
  'eye',
  'eye-off',
  'plus',
  'trash',
  'pencil',
  'clock',
  'detail',
  'settings',
  'download',
] as const

interface IconProps {
  type: (typeof ICON_NAMES)[number]
  className?: string
  size?: number
}

export function Icon({ type, className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} className={cn('size-4', className)}>
      <use xlinkHref={`/sprite.svg#${type}`}></use>
    </svg>
  )
}
