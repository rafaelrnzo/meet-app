import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import React from 'react'

interface TableViewFilterProps {
  options: { value: string; label: string }[]
  placeholder?: string
  selectProps?: {
    select?: React.ComponentProps<typeof Select>
    selectTrigger?: React.ComponentProps<typeof SelectTrigger>
    selectContent?: React.ComponentProps<typeof SelectContent>
    selectGroup?: React.ComponentProps<typeof SelectGroup>
    selectItem?: React.ComponentProps<typeof SelectItem>
  }
}

function TableViewFilter(props: TableViewFilterProps) {
  const { options = [], placeholder = 'Filter', selectProps } = props

  return (
    <Select {...selectProps?.select}>
      <SelectTrigger
        {...selectProps?.selectTrigger}
        className={cn(
          'cursor-pointer gap-2 font-semibold md:border md:border-red-800 md:bg-red-50 md:text-red-800 md:hover:bg-red-200 [&>svg]:opacity-100',
          'md:data-[state=open]:bg-red-800 md:data-[state=open]:text-white',
          selectProps?.selectTrigger?.className
        )}
      >
        {selectProps?.selectTrigger?.children ?? placeholder}
      </SelectTrigger>
      <SelectContent
        {...selectProps?.selectContent}
        align='end'
        position='popper'
        className='wrap-anywhere max-md:w-[calc(100vw-64px)]'
      >
        <SelectGroup>
          {options.map((item, index) => (
            <SelectItem value={item.value} key={`table-filter-${index}`}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export type { TableViewFilterProps }
export { TableViewFilter }
