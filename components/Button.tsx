'use client'

import type { ComponentProps, FC } from 'react'
import { cn } from '@/lib/utils'

export const Button: FC<ComponentProps<'button'>> = ({ className, ...props }) => {
  return (
    <button
      type='button'
      className={cn(
        'text-foreground inline-flex items-center justify-center rounded-md border px-3 shadow',
        'hover:not-disabled:bg-secondary focus:ring-primary bg-background not-disabled:cursor-pointer disabled:opacity-40',
        className
      )}
      {...props}
    />
  )
}

export const ButtonTab: FC<ComponentProps<'button'> & { isActive?: boolean }> = ({
  className,
  isActive,
  ...props
}) => {
  return (
    <button
      type='button'
      className={cn(
        'focus:ring-primary bg-background text-foreground inline-flex size-10 items-center justify-center rounded-md border shadow not-disabled:cursor-pointer disabled:opacity-40',
        isActive
          ? 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900'
          : 'text-muted-foreground hover:not-disabled:text-primary hover:not-disabled:border-primary hover:not-disabled:bg-primary/20',
        className
      )}
      {...props}
    />
  )
}

export const ButtonIcon: FC<ComponentProps<'button'> & { isActive?: boolean }> = ({
  isActive,
  ...props
}) => {
  return (
    <button
      type='button'
      {...props}
      className={cn(
        'relative flex size-12 cursor-pointer items-center justify-center rounded-full disabled:opacity-40',
        isActive
          ? 'text-primary border-muted-foreground border bg-white hover:not-disabled:bg-zinc-100'
          : 'bg-primary text-primary-foreground hover:not-disabled:bg-red-900',

        props.className
      )}
    />
  )
}
