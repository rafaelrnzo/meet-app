'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { filterByQuery } from '@/lib/helpers'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'

interface ComboboxOption {
  value: string
  label: string
  count?: string
}

interface ComboboxProps<T extends ComboboxOption> {
  onSelect?: (value: string) => void
  defaultPrevented?: boolean
  onPreventDefault?: (value: string) => void
  selected?: string
  items: (T & React.ComponentProps<typeof CommandItem>)[]
  searchByValue?: boolean
  popover?: React.ComponentProps<typeof Popover>
  popoverContent?: React.ComponentProps<typeof PopoverContent>
  popoverTrigger?: React.ComponentProps<typeof Button>
  command?: React.ComponentProps<typeof Command>
  commandInput?: React.ComponentProps<typeof CommandInput>
  commandList?: React.ComponentProps<typeof CommandList>
  commandEmpty?: React.ComponentProps<typeof CommandEmpty>
  commandGroup?: React.ComponentProps<typeof CommandGroup>
}

function Combobox<T extends ComboboxOption>({
  onSelect,
  selected,
  items,
  searchByValue = false,
  popover,
  popoverTrigger,
  popoverContent,
  command,
  commandInput,
  commandList,
  commandEmpty,
  commandGroup,
  defaultPrevented,
  onPreventDefault,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(selected ?? '')
  const [query, setQuery] = useState('')
  const stateOpen = popover?.open ?? open
  const setStateOpen = popover?.onOpenChange ?? setOpen

  // Sync local state with controlled state. Be careful!
  // Either null/undefined considered as uncontrolled and it will be untracked.
  useEffect(() => {
    if (typeof selected === 'string') {
      setValue(selected)
    }
  }, [selected])

  return (
    <Popover {...popover} open={stateOpen} onOpenChange={setStateOpen}>
      <PopoverTrigger asChild>
        <Button
          {...popoverTrigger}
          variant={popoverTrigger?.variant ?? 'secondary-outline'}
          role='combobox'
          aria-expanded={stateOpen}
          className={cn(
            'w-full justify-between font-normal in-data-[slot=popover-content]:text-[93.75%]',
            (!popoverTrigger?.variant || popoverTrigger?.variant === 'secondary-outline') &&
              'hover:bg-neutral-50 active:bg-transparent',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:placeholder:text-slate-700',
            popoverTrigger?.className
          )}
        >
          <span className={cn('overflow-hidden', !value && 'opacity-60')}>
            {items.find((item) => item.value === value)?.label ??
              popoverTrigger?.children ??
              'Select item...'}
          </span>
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        {...popoverContent}
        className={cn('w-(--radix-popover-trigger-width) p-0', popoverContent?.className)}
        onCloseAutoFocus={(e) => {
          setQuery('')
          popoverContent?.onCloseAutoFocus?.(e)
        }}
      >
        <Command {...command} shouldFilter={searchByValue}>
          <CommandInput
            {...commandInput}
            placeholder={commandInput?.placeholder ?? 'Search item...'}
            className={cn('h-9', commandInput?.className)}
            onValueChange={(e) => {
              setQuery(e)
              commandInput?.onValueChange?.(e)
            }}
          />
          <CommandList {...commandList}>
            <CommandEmpty {...commandEmpty}>
              {commandEmpty?.children ?? 'No item found.'}
            </CommandEmpty>
            <CommandGroup {...commandGroup}>
              {(searchByValue ? items : filterByQuery(query, items)).map(
                ({ value: val, label, count, ...item }) => (
                  <CommandItem
                    key={val}
                    {...item}
                    value={val}
                    onSelect={(currentValue) => {
                      const updatedValue = currentValue === value ? '' : currentValue

                      if (defaultPrevented) {
                        return onPreventDefault?.(updatedValue)
                      }

                      // Local state
                      setValue(updatedValue)
                      setOpen(false)

                      // Callback
                      onSelect?.(updatedValue)
                    }}
                  >
                    <div className='flex flex-1 items-center justify-between gap-2.5'>
                      <span className='wrap-anywhere'>{label.trim() || '-'}</span>
                      {count && <span className='wrap-anywhere'>{count}</span>}
                    </div>
                    <Check className={cn('ml-auto', value === val ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                )
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxProps }
