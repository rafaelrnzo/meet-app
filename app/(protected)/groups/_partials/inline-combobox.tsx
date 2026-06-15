'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: string
}

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
    if (selected) onValueChange(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    if (!open) setSelected([])
  }, [open])

  return (
    <div className='min-h-11 gap-2'>
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
        <div
          className='rounded-md border border-neutral-400'
          style={{
            maxHeight: filtered.length === 0 ? 'max-h-fit' : maxHeight,
          }}
        >
          {filtered.length === 0 ? (
            <div className='p-3 text-sm text-slate-950'>Tidak ada data.</div>
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
                    className='flex min-h-11 w-full items-center justify-between hover:bg-transparent'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className={cn(
                          selectedItem
                            ? 'border-red-800 bg-red-50 text-red-800'
                            : 'border-neutral-400 text-slate-950',
                          'flex h-8 w-8 items-center justify-center rounded-full border-[0.5px] text-sm font-semibold'
                        )}
                      >
                        {item.label.substring(0, 2).toUpperCase()}
                      </div>

                      <span
                        className={cn(
                          selectedItem ? 'text-red-800' : 'text-slate-950',
                          'text-sm font-normal'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    <Check
                      className={`h-4 w-4 text-red-800 transition-opacity ${
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
