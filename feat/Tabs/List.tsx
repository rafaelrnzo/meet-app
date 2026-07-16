'use client'

import type { ComponentProps, FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { default as dayjs } from 'dayjs'
import { cn, djs } from '@/lib/utils'
import { useRoomState } from '@/feat/Room'

export const TabsListGroups: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return <div {...props} className={cn('flex flex-col gap-2', className)} />
}

export const TabsListGroup: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return <div {...props} className={cn('flex flex-col gap-2', className)} />
}

export const TabsListTitle: FC<ComponentProps<'h3'>> = ({ className, ...props }) => {
  return <h3 {...props} className={cn('text-muted-foreground font-semibold', className)} />
}

export const TabsList: FC<ComponentProps<'ul'>> = ({ className, ...props }) => {
  return <ul {...props} className={cn('-mx-2.5 flex flex-col gap-3', className)} />
}

export const TabsListItem: FC<ComponentProps<'li'>> = ({ className, ...props }) => {
  return (
    <li
      {...props}
      className={cn(
        'has-[[data-slot="tabs-list-item-action"]:hover:not(:disabled)]:bg-primary/10 has-[[data-slot="tabs-list-item-action"]:hover:not(:disabled)]:border-primary relative grid grid-cols-[40px_1fr_auto] items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm',
        className
      )}
    />
  )
}

export const TabsListItemIcon: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      {...props}
      className={cn(
        'border-primary bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md border *:size-5',
        className
      )}
    />
  )
}

export const TabsListItemContent: FC<ComponentProps<'div'>> = ({ className, ...props }) => {
  return <div {...props} className={cn('mr-auto flex h-10 flex-col justify-between', className)} />
}

export const TabsListItemTitle: FC<ComponentProps<'p'>> = ({ className, ...props }) => {
  return <p {...props} className={cn('text-primary font-semibold', className)} />
}

export const TabsListItemText: FC<ComponentProps<'p'>> = ({ className, ...props }) => {
  return <p {...props} className={cn('text-xs', className)} />
}

export const TabsListItemAction: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      type='button'
      data-slot='tabs-list-item-action'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn('absolute inset-0 rounded-md', !props.disabled && 'cursor-pointer', className)}
    />
  )
}

export const TabsListItemActionStart: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      type='button'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn(
        'border-primary bg-primary/10 text-primary hover:bg-primary/20 inline-flex h-8 items-center justify-center rounded-md border px-2.5 font-semibold hover:not-disabled:cursor-pointer disabled:opacity-40',
        !props.disabled && 'cursor-pointer',
        className
      )}
    />
  )
}

export const TabsListItemActionRecord: FC<ComponentProps<'button'>> = ({
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      type='button'
      {...props}
      onClick={(e) => onClick?.(e)}
      className={cn(
        'border-destructive text-destructive rounded-full disabled:opacity-40',
        !props.disabled && 'cursor-pointer',
        className
      )}
    />
  )
}

export const TabsListItemContentRecord: FC<{
  onRecord?: boolean
  title: string
  description: string
}> = ({ onRecord, title, description }) => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(void 0)
  const [recordDuration, setRecordDuration] = useState('')
  const { recordData } = useRoomState()

  useEffect(() => {
    const startAt = recordData?.startedAt
    const endedAt = recordData?.endedAt

    if (!startAt) return

    const updateDuration = (currentTime: number) => {
      const diff = djs(currentTime).diff(djs(startAt / 1_000_000), 'seconds')
      setRecordDuration(dayjs.duration(diff, 'seconds').format('HH:mm:ss'))
    }

    if (endedAt) {
      updateDuration(endedAt / 1_000_000)
      return
    }

    updateDuration(Date.now())

    intervalRef.current = setInterval(() => {
      updateDuration(Date.now())
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [recordData?.endedAt, recordData?.startedAt])

  return (
    <TabsListItemContent>
      <TabsListItemTitle>
        {onRecord && recordDuration
          ? 'Perekaman dimulai'
          : !onRecord && recordDuration
            ? 'Perekaman dihentikan'
            : title}
      </TabsListItemTitle>
      <TabsListItemText>{recordDuration || description}</TabsListItemText>
    </TabsListItemContent>
  )
}
