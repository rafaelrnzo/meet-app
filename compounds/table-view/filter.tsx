import { buttonVariants } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import React, { useState } from 'react'

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
  const [filterValue, setFilterValue] = useState('')

  return (
    <Select
      {...selectProps?.select}
      value={selectProps?.select?.value ?? filterValue}
      onValueChange={(currentValue) =>
        selectProps?.select?.onValueChange?.(currentValue) ??
        setFilterValue(currentValue === 'all' ? '' : currentValue)
      }
    >
      <SelectTrigger
        {...selectProps?.selectTrigger}
        className={cn(
          buttonVariants({ variant: 'primary-outline' }),
          'h-9 w-50 gap-2 px-4 py-[7.5px] font-semibold data-[state=open]:bg-red-800 data-[state=open]:text-white @max-[496px]/table-header:w-full [&>svg]:opacity-100',
          selectProps?.selectTrigger?.className
        )}
      >
        <SelectValue className='truncate whitespace-normal' placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        {...selectProps?.selectContent}
        align='end'
        position='popper'
        className='w-(--radix-select-trigger-width) wrap-anywhere'
      >
        <SelectGroup>
          <SelectItem value='all' key={`table-filter-all`}>
            Semua
          </SelectItem>
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
