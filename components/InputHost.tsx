'use client'

import type { ComponentProps, FC } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRoomState } from '@/feat/Room'
import { ArrowRight02Icon, Checkmark, HugeIcon } from '@/components/HugeIcon'
import { ButtonTab } from '@/components/Button'

export interface InputHostProps extends Pick<
  ComponentProps<'input'>,
  'placeholder' | 'className' | 'name'
> {
  url?: string
  onSave?: (newValue: string) => void
  onEnter?: (newValue: string) => void
}

export const InputHost: FC<InputHostProps> = ({
  placeholder,
  className,
  name = 'file-url',
  url = '',
  onEnter,
  onSave,
}) => {
  const { record, isHost } = useRoomState()
  const [loading, setLoading] = useState(false)
  const [localUrl, setLocalUrl] = useState(url)
  const [isTempSave, setIsTempSave] = useState(false)

  async function onSaveCallback() {
    try {
      setLoading(true)

      await new Promise((res) => setTimeout(res, 1000))
      await Promise.resolve(onSave?.(localUrl.trim()))

      setIsTempSave(true)
      setTimeout(() => setIsTempSave(false), 2_000)
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isHost) {
    return
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 z-10 flex h-11 max-w-full items-center gap-2 px-2',
        record ? 'right-29' : 'right-10'
      )}
    >
      <input
        type='text'
        name={name}
        placeholder={placeholder}
        value={localUrl}
        autoComplete='off'
        onChange={(e) => setLocalUrl(e.currentTarget.value)}
        className={cn(
          'bg-foreground text-background border-muted-foreground w-full flex-1 truncate rounded-md border px-3 py-1 text-sm shadow',
          className
        )}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || !localUrl) return

          onEnter?.(localUrl.trim())
        }}
      />
      <ButtonTab
        title='Publikasikan'
        className='not-disabled:hover:border-muted-foreground text-background size-7.5 border-0 bg-blue-500 text-sm not-disabled:hover:bg-blue-600 not-disabled:hover:text-white'
        disabled={loading || !localUrl}
        onClick={onSaveCallback}
      >
        {isTempSave ? (
          <HugeIcon size={18} icon={Checkmark} />
        ) : (
          <HugeIcon size={18} icon={ArrowRight02Icon} />
        )}
      </ButtonTab>
    </div>
  )
}
