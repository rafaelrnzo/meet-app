'use client'

import * as React from 'react'
import { Clock2Icon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { id as LocaleId } from 'react-day-picker/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn, djs } from '@/lib/utils'

type CalendarWithTimeProps = Omit<React.ComponentProps<typeof Input>, 'popover' | 'onSelect'> & {
  popover?: React.ComponentProps<typeof Popover>
  popoverContent?: React.ComponentProps<typeof PopoverContent>
  calendar?: React.ComponentProps<typeof Calendar>
  selected?: {
    startTime?: Date
    endTime?: Date
  }
  onSelect?: ({ startTime, endTime }: { startTime?: Date; endTime?: Date }) => void
  startTimeProps?: React.ComponentProps<'input'>
  endTimeProps?: React.ComponentProps<'input'>
}

function CalendarWithTime(props: CalendarWithTimeProps) {
  const {
    popover,
    popoverContent,
    calendar,
    selected,
    onSelect,
    startTimeProps,
    endTimeProps,
    ...rest
  } = props
  const [startTime, setStartTime] = React.useState<Date | undefined>(selected?.startTime)
  const [endTime, setEndTime] = React.useState<Date | undefined>(selected?.endTime)

  const handleGetCurrentTime = ({ prev, next }: { prev?: Date; next?: Date }): Date => {
    const base = prev ?? next ?? new Date()
    const baseDate = djs(base)
    const nextDate = djs(next ?? base)
    return nextDate
      .hour(baseDate.hour())
      .minute(baseDate.minute())
      .second(baseDate.second())
      .toDate()
  }

  const placeholder = React.useMemo(() => {
    const start = startTime
      ? djs(startTime).format('DD/MMMM/YYYY, HH:mm:ss')
      : 'Tanggal/Bulan/Tahun, Jam mulai'
    const end = endTime ? djs(endTime).format('HH:mm:ss') : 'Jam akhir'
    return `${start} : ${end}`
  }, [startTime, endTime])

  const handleChangeDate = (value?: Date) => {
    if (!value) return

    const currentStartTime = handleGetCurrentTime({ prev: startTime, next: value })
    const currentEndTime = handleGetCurrentTime({ prev: endTime, next: value })

    setStartTime(currentStartTime)
    setEndTime(currentEndTime)
    onSelect?.({ startTime: currentStartTime, endTime: currentEndTime })
  }

  const handleGetTime = ({
    value = '00:00:00',
    target,
  }: {
    value: string
    target: 'startTime' | 'endTime'
  }) => {
    const [hour, minute, second] = value.split(':').map(Number)
    const base = (target === 'startTime' ? startTime : endTime) ?? new Date()
    const currentTime = djs(base).hour(hour).minute(minute).second(second).toDate()
    if (target === 'startTime') {
      setStartTime(currentTime)
      onSelect?.({ startTime: currentTime, endTime })
      return
    }
    setEndTime(currentTime)
    onSelect?.({ startTime, endTime: currentTime })
  }

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [maxHeight, setMaxHeight] = React.useState<number>()
  const [open, onOpenChange] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    function updateHeight() {
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

  return (
    <Popover {...popover} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Input
          {...rest}
          type='button'
          value={placeholder}
          onChange={() => void 0}
          className={cn('text-left', !startTime && !endTime && 'text-neutral-400', rest.className)}
          ref={inputRef}
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
              captionLayout='dropdown'
              {...calendar}
              mode='single'
              selected={startTime}
              onSelect={(value) => handleChangeDate(value)}
              locale={LocaleId}
              className={cn('p-0', calendar?.className)}
            />
          </CardContent>
          <CardFooter className='rounded-b-md border-t px-0 pt-4 pb-0'>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='time-from'>Jam mulai</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...startTimeProps}
                    id='time-from'
                    type='time'
                    step='1'
                    className={cn(
                      'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
                      startTimeProps?.className
                    )}
                    value={startTime ? djs(startTime).format('HH:mm:ss') : ''}
                    onChange={(event) =>
                      handleGetTime({ value: event.target.value, target: 'startTime' })
                    }
                  />
                  <InputGroupAddon>
                    <Clock2Icon className='text-muted-foreground' />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor='time-to'>Jam berakhir</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...endTimeProps}
                    id='time-to'
                    type='time'
                    step='1'
                    className={cn(
                      'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
                      endTimeProps?.className
                    )}
                    value={endTime ? djs(endTime).format('HH:mm:ss') : ''}
                    onChange={(event) =>
                      handleGetTime({ value: event.target.value, target: 'endTime' })
                    }
                  />
                  <InputGroupAddon>
                    <Clock2Icon className='text-muted-foreground' />
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
