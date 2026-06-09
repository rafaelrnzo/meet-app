'use client'
import { cn } from '@/lib/utils'
import { TableViewFilter } from './filter'
import type { TableViewFilterProps } from './filter'
import React, { useRef } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Icon } from '@/components/ui/icon'

interface TableViewSearchProps extends React.ComponentProps<'input'> {
  onSearch?: (value: string) => void
  filter?: TableViewFilterProps
  wrapper?: { className?: HTMLDivElement['className'] }
}

function TableViewSearch(props: TableViewSearchProps) {
  const { onSearch, filter, wrapper, ...rest } = props
  const currentSearch = useRef('')

  const handleSearch = (value: string) => {
    const text = value.trim()
    if (currentSearch.current === text) {
      return
    }

    onSearch?.(text)
    currentSearch.current = text
  }

  return (
    <InputGroup
      {...wrapper}
      className={cn(
        'has-[[data-slot][aria-invalid=true]]:[&>input]:text-error has-[[data-slot][aria-invalid=true]]:border-red-200 has-[[data-slot][aria-invalid=true]]:bg-red-200 md:max-w-75',
        wrapper?.className
      )}
    >
      <InputGroupInput
        {...rest}
        name='searchQuery'
        type='search'
        onChange={(event) => {
          const value = event.target.value
          if (!value) {
            handleSearch(value)
          }
          rest.onChange?.(event)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            const value = event.currentTarget.value
            handleSearch(value)
          }
          rest.onKeyDown?.(event)
        }}
      />
      <InputGroupAddon>
        <Icon type='search' />
      </InputGroupAddon>
      {!!filter && (
        <InputGroupAddon align='inline-end' className='mr-0! p-0 md:hidden'>
          <TableViewFilter {...filter} />
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export type { TableViewSearchProps }
export { TableViewSearch }
