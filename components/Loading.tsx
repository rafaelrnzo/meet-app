import type { ComponentProps, FC } from 'react'
import { SpinnerIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export const Loading: FC<ComponentProps<'div'>> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'bg-background text-muted-foreground absolute inset-0 flex items-center justify-center overflow-hidden text-sm',
        className
      )}
    >
      <SpinnerIcon size={24} className='mr-1 animate-spin' /> {children ?? 'Sedang memuat...'}
    </div>
  )
}
