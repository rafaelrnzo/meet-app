'use client'

import React, { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TimeField = 'hour' | 'minute' | 'second'

interface TimeInputProps extends React.ComponentProps<'div'> {
  value: Record<TimeField, string>
  setValue: React.Dispatch<Record<TimeField, string>>
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

const normalize = (value: string, max: number) => {
  const num = Number(value.replace(/\D/g, '')) || 0
  return String(clamp(num, 0, max)).padStart(2, '0')
}

function TimeInput({ value, setValue, className, ...rest }: TimeInputProps) {
  const refs = {
    hour: useRef<HTMLInputElement>(null),
    minute: useRef<HTMLInputElement>(null),
    second: useRef<HTMLInputElement>(null),
  }

  const [draft, setDraft] = useState({
    hour: value.hour !== '' ? normalize(value.hour, 23) : '',
    minute: value.minute !== '' ? normalize(value.minute, 59) : '',
    second: value.second !== '' ? normalize(value.second, 59) : '',
  })

  const focusField = (field: TimeField) => {
    const element = refs[field].current
    if (!element) return
    element.focus()
    element.select()
  }

  const updateField = (field: TimeField, raw: string) => {
    const next = {
      hour: draft.hour || '00',
      minute: draft.minute || '00',
      second: draft.second || '00',
      [field]: raw.replace(/\D/g, '').slice(0, 2),
    }
    setDraft(next)
    setValue({
      hour: normalize(next.hour, 23),
      minute: normalize(next.minute, 59),
      second: normalize(next.second, 59),
    })
  }

  const handleBlur = (field: TimeField) => {
    const max = field === 'hour' ? 23 : 59

    if (Object.values(draft).every((val) => val === '')) return

    const next = {
      hour: draft.hour || '00',
      minute: draft.minute || '00',
      second: draft.second || '00',
      [field]: normalize(draft[field], max),
    }

    setDraft(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: TimeField) => {
    const input = e.currentTarget
    const raw = Number(input.value || 0)
    const max = field === 'hour' ? 23 : 59

    switch (e.key) {
      case 'ArrowRight': {
        if (input.selectionStart !== input.value.length) break
        if (field === 'hour') focusField('minute')
        else if (field === 'minute') focusField('second')
        break
      }

      case 'ArrowLeft': {
        if (input.selectionStart !== 0) break
        if (field === 'second') focusField('minute')
        else if (field === 'minute') focusField('hour')
        break
      }

      case 'Backspace': {
        if (input.value !== '') break
        if (field === 'second') focusField('minute')
        else if (field === 'minute') focusField('hour')
        break
      }

      case 'ArrowUp': {
        if (raw === max) return
        const next = clamp(raw + 1, 0, max)
        updateField(field, String(next).padStart(2, '0'))
        break
      }

      case 'ArrowDown': {
        if (raw === 0) return
        const next = clamp(raw - 1, 0, max)
        updateField(field, String(next).padStart(2, '0'))
        break
      }
    }
  }

  const inputProps = (field: TimeField): React.ComponentProps<typeof Input> => ({
    value: draft[field],
    placeholder: '--',
    maxLength: 2,
    inputMode: 'numeric',
    pattern: '[0-9]*',
    className:
      'w-6 rounded border-none shadow-none p-0.5 text-center font-mono focus-visible:ring-0 hover:bg-transparent',
    onChange: (event) => updateField(field, event.target.value),
    onBlur: () => handleBlur(field),
    onFocus: (event) => event.target.select(),
    onKeyDown: (event) => handleKeyDown(event, field),
  })

  return (
    <div {...rest} className={cn('flex items-center', className)}>
      <Input ref={refs.hour} type='text' {...inputProps('hour')} />
      <span>:</span>
      <Input ref={refs.minute} type='text' {...inputProps('minute')} />
      <span>:</span>
      <Input ref={refs.second} type='text' {...inputProps('second')} />
    </div>
  )
}

export { TimeInput }
export type { TimeInputProps }
