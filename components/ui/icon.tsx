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
  'block',
  'door',
  'hourglass',
  'lock-open',
  'slash-door',
  'upload',
  'file-txt',
  'grip',
  'handraise',
  'handraise-off',
  'heading-1',
  'heading-2',
  'heading-3',
  'info',
  'italic',
  'list',
  'list-ordered',
  'message',
  'mic',
  'mic-off',
  'minus',
  'mute',
  'notebook',
  'phone-off',
  'pin',
  'pin-off',
  'polling',
  'presentation',
  'recording',
  'send',
  'settings-meet',
  'sparkle',
  'square-play',
  'tools-meet',
  'user-meet',
  'user-out',
  'users-meet',
  'video-off',
  'whiteboard',
  'back',
  'bold',
  'chevron-right-meet',
  'desktop-play',
  'desktop-play-off',
  'email',
  'emoticon',
  'emot-off',
  'file-pdf',
  'file-plus',
  'check',
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
