'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { Option } from '@/app/(protected)/groups/_partials/form-controller'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type InlineComboboxProps = {
  items: Option[]
  onValueChange: (e: Option[]) => void
  buttonProps?: React.ComponentProps<typeof Button>
  placeholder?: string
}

export default function InlineCombobox({
  items,
  onValueChange,
  buttonProps,
  placeholder,
}: InlineComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Option[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef?.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    return items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  }, [items, query])

  const ITEM_HEIGHT = 44 //height from figma
  const MAX_VISIBLE = 3 //based on ac data length
  const maxHeight =
    filtered.length > MAX_VISIBLE ? ITEM_HEIGHT * MAX_VISIBLE : ITEM_HEIGHT * filtered.length

  const isSelected = (value: string) => {
    return selected.some((item) => item.value === value)
  }

  const toggleItem = (item: Option) => {
    setSelected((prev) => {
      let updated: Option[]
      if (prev.some((i) => i.value === item.value)) {
        updated = prev.filter((i) => i.value !== item.value)
      } else {
        updated = [...prev, item]
      }
      return updated
    })
  }

  useEffect(() => {
    if (selected) onValueChange?.(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <div ref={wrapperRef} className='min-h-11 gap-2'>
      <div className='mb-4 flex items-center justify-between gap-2'>
        <div className='flex min-h-11 w-full flex-wrap items-center gap-2'>
          <Input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            placeholder={placeholder}
            className='flex-1 bg-transparent outline-none'
          />
        </div>
        <div>
          <Button
            {...buttonProps}
            variant='primary'
            type='submit'
            className='w-full md:w-fit'
            onClick={() => setOpen(false)}
          >
            {buttonProps?.children}
          </Button>
        </div>
      </div>
      {open && (
        <div className='rounded-md border border-neutral-400' style={{ maxHeight }}>
          {filtered.length === 0 ? (
            <div className='text-muted-foreground p-3 text-sm'>Tidak ada data.</div>
          ) : (
            <div className='overflow-y-auto' style={{ maxHeight }}>
              {filtered.map((item) => {
                const selectedItem = isSelected(item.value)
                return (
                  <Button
                    variant='ghost'
                    key={item.value}
                    type='button'
                    onClick={() => toggleItem(item)}
                    className='hover:bg-muted flex min-h-11 w-full items-center justify-between'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full border text-xs'>
                        {item.label.substring(0, 2).toUpperCase()}
                      </div>

                      <span className='text-sm font-medium'>{item.label}</span>
                    </div>
                    <Check
                      className={`h-4 w-4 transition-opacity ${
                        selectedItem ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
