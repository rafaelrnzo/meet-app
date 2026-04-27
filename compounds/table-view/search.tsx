'use client'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { TableViewFilter } from './filter'
import type { TableViewFilterProps } from './filter'
import React, { useRef } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

interface TableViewSearchProps extends React.ComponentProps<'input'> {
  onSearch?: ({ event, value }: { event: React.FormEvent<HTMLFormElement>; value: string }) => void
  filter?: TableViewFilterProps
}

function TableViewSearch(props: TableViewSearchProps) {
  const { className, onSearch, filter, ...rest } = props
  const currentSearch = useRef('')

  return (
    <form
      className='relative w-full min-[830px]:w-75'
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const searchQuery = formData.get('searchQuery') ?? ''
        const value = typeof searchQuery === 'string' ? searchQuery.trim() : ''

        if (currentSearch.current === value) {
          return
        }

        onSearch?.({ event, value })
        currentSearch.current = value
      }}
    >
      <InputGroup className='has-[[data-slot][aria-invalid=true]]:[&>input]:text-error has-[[data-slot][aria-invalid=true]]:border-red-200 has-[[data-slot][aria-invalid=true]]:bg-red-200'>
        <InputGroupInput
          {...rest}
          name='searchQuery'
          type='search'
          className={cn('w-full min-[830px]:w-75', className)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {!!filter && (
          <InputGroupAddon align='inline-end' className='mr-0! p-0 md:hidden'>
            <TableViewFilter {...filter} />
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}

export type { TableViewSearchProps }
export { TableViewSearch }
