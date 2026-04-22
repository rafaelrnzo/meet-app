'use client'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import React, { useRef } from 'react'

type TableViewSearchProps = React.ComponentProps<'input'> & {
  onSearch?: ({ event, value }: { event: React.FormEvent<HTMLFormElement>; value: string }) => void
}

function TableViewSearch(props: TableViewSearchProps) {
  const { className, onSearch, ...rest } = props
  const currentSearch = useRef('')

  return (
    <form
      className='relative w-75 @max-[496px]/table-header:w-full'
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const searchQuery = formData.get('searchQuery') ?? ''
        if (typeof searchQuery !== 'string' || currentSearch.current === searchQuery) {
          return
        }
        const value = searchQuery.trim()
        onSearch?.({ event, value })
        currentSearch.current = searchQuery
      }}
    >
      <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400' />
      <Input {...rest} name='searchQuery' type='search' className={cn('pl-9 md:w-75', className)} />
    </form>
  )
}

export type { TableViewSearchProps }
export { TableViewSearch }
