'use client'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { id as LocaleId } from 'react-day-picker/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn, djs } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { DEFAULT_EMPTY_TIME, TimeInput } from '@/components/ui/time'
import { useEffect, useRef, useState } from 'react'
import type { TimeInputProps } from '@/components/ui/time'

interface CalendarWithTimeValue {
  startDate?: Date
  endDate?: Date
}

type CalendarWithTimeProps = Omit<React.ComponentProps<typeof Input>, 'popover' | 'onSelect'> & {
  popover?: React.ComponentProps<typeof Popover>
  popoverContent?: React.ComponentProps<typeof PopoverContent>
  calendar?: React.ComponentProps<typeof Calendar>
  selected: CalendarWithTimeValue
  onSelect: (props: CalendarWithTimeValue) => void
  startTimeProps?: React.ComponentProps<typeof TimeInput>
  endTimeProps?: React.ComponentProps<typeof TimeInput>
}

const dateToTime = (date?: Date): TimeInputProps['value'] =>
  date
    ? {
        hour: String(date.getHours()),
        minute: String(date.getMinutes()),
        second: String(date.getSeconds()),
      }
    : DEFAULT_EMPTY_TIME

const isValidTime = (time: TimeInputProps['value']) => Object.values(time).every(Boolean)

const formatTime = (time: TimeInputProps['value'], fallback: string) =>
  isValidTime(time)
    ? [time.hour, time.minute, time.second].map((v) => String(v).padStart(2, '0')).join('.')
    : fallback

function CalendarWithTime({
  popover,
  popoverContent,
  calendar,
  selected,
  onSelect,
  startTimeProps,
  endTimeProps,
  ...rest
}: CalendarWithTimeProps) {
  const { startDate, endDate } = selected
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [maxHeight, setMaxHeight] = useState<number>()
  const [date, setDate] = useState<Date | undefined>(startDate ?? endDate)
  const [startTime, setStartTime] = useState<TimeInputProps['value']>(
    startTimeProps?.value ?? dateToTime(startDate)
  )
  const [endTime, setEndTime] = useState<TimeInputProps['value']>(
    endTimeProps?.value ?? dateToTime(endDate)
  )
  const placeholder = `${date ? djs(date).format('DD/MMMM/YYYY') : 'Tanggal/Bulan/Tahun'}, ${formatTime(startTime, 'Jam mulai')} : ${formatTime(endTime, 'Jam akhir')}`

  useEffect(() => {
    if (!open) return

    const updateHeight = () => {
      if (!inputRef.current) return

      const rect = inputRef.current.getBoundingClientRect()
      const spaceAbove = rect.top - 16
      const spaceBelow = window.innerHeight - rect.bottom - 16

      setMaxHeight(Math.max(spaceAbove, spaceBelow))
    }

    updateHeight()

    window.addEventListener('resize', updateHeight)
    window.addEventListener('scroll', updateHeight, true)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('scroll', updateHeight, true)
    }
  }, [open])

  const handleMergeDateTime = (date: Date, time: TimeInputProps['value']) => {
    return isValidTime(time)
      ? djs(date)
          .hour(Number(time.hour))
          .minute(Number(time.minute))
          .second(Number(time.second))
          .toDate()
      : undefined
  }

  const handleUpdateTime = (value: TimeInputProps['value'], target: 'startTime' | 'endTime') => {
    const baseDate = date ?? new Date()

    if (!date) {
      setDate(baseDate)
    }

    if (target === 'startTime') {
      setStartTime(value)
    } else {
      setEndTime(value)
    }

    const nextDate = handleMergeDateTime(baseDate, value)

    onSelect({
      startDate: target === 'startTime' ? nextDate : startDate,
      endDate: target === 'endTime' ? nextDate : endDate,
    })
  }

  return (
    <Popover {...popover} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          {...rest}
          ref={inputRef}
          type='button'
          value={placeholder}
          onChange={() => void 0}
          className={cn(
            'text-left',
            !date &&
              !isValidTime(startTime) &&
              !isValidTime(endTime) &&
              'text-neutral-400 aria-invalid:text-neutral-400',
            'disabled:border-neutral-400 disabled:bg-slate-300 disabled:text-slate-400 disabled:opacity-100',
            rest.className
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        align='start'
        {...popoverContent}
        style={{ maxHeight }}
        asChild
        className={cn('p-4', popoverContent?.className)}
      >
        <Card className='mx-auto w-fit overflow-y-auto rounded-md'>
          <CardContent className='px-0 pt-0 pb-6'>
            <Calendar
              {...calendar}
              mode='single'
              locale={LocaleId}
              captionLayout='dropdown'
              selected={date}
              onSelect={(value) => {
                const nextDate = value ?? new Date()
                setDate(nextDate)
                const startDate = handleMergeDateTime(nextDate, startTime)
                const endDate = handleMergeDateTime(nextDate, endTime)

                onSelect({ startDate, endDate })
              }}
              className={cn('p-0', calendar?.className)}
            />
          </CardContent>
          <CardFooter className='rounded-b-md border-t px-0 pt-4 pb-0'>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='time-from'>Jam mulai</FieldLabel>
                <InputGroup>
                  <TimeInput
                    {...startTimeProps}
                    id='time-from'
                    value={startTime}
                    setValue={(value) => handleUpdateTime(value, 'startTime')}
                  />
                  <InputGroupAddon>
                    <Icon type='clock' className='text-slate-400' />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor='time-to'>Jam berakhir</FieldLabel>
                <InputGroup>
                  <TimeInput
                    {...endTimeProps}
                    id='time-to'
                    value={endTime}
                    setValue={(value) => handleUpdateTime(value, 'endTime')}
                  />
                  <InputGroupAddon>
                    <Icon type='clock' className='text-slate-400' />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

export type { CalendarWithTimeProps }
export { CalendarWithTime }
