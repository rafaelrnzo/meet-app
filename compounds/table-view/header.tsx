'use client'

import type { ReactNode } from 'react'
import type { SortingState, Table } from '@tanstack/react-table'
import type { TableViewSearchProps } from '@/compounds/table-view/search'
import type { TableViewFilterProps } from '@/compounds/table-view/filter'
import type { TableViewButtonProps } from '@/compounds/table-view'
import { useState } from 'react'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { SelectPageSize } from './pagination'
import { cn } from '@/lib/utils'
import { TableViewSearch } from '@/compounds/table-view/search'
import { TableViewFilter } from '@/compounds/table-view/filter'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

interface TableViewHeaderProps<TData> {
  search?: TableViewSearchProps
  filter?: TableViewFilterProps
  add?: TableViewButtonProps
  addCustom?: ReactNode
  refresh?: TableViewButtonProps
  table?: Table<TData>
  pageSizeOptions?: number[]
  headerAddon?: React.ReactNode
}

function ButtonRefresh({
  refresh,
  className,
}: {
  refresh: TableViewButtonProps
  className?: React.ComponentProps<'button'>['className']
}) {
  return (
    <Button variant='primary-outline' {...refresh} className={cn(className, refresh?.className)}>
      {refresh?.children ?? (
        <>
          <Icon type='arrow-clockwise' className='-rotate-90' />
          <span className='max-md:hidden'>Segarkan Halaman</span>
        </>
      )}
    </Button>
  )
}

function TableViewHeader<TData>(props: TableViewHeaderProps<TData>) {
  const { search, filter, add, addCustom, refresh, table, pageSizeOptions, headerAddon } = props
  const filterMobile = {
    ...(filter && {
      filter: {
        ...filter,
        selectProps: {
          selectTrigger: {
            children: <Icon type='filter' size={16} />,
            className:
              'border-0 shadow-none bg-transparent text-slate-400 data-[state=open]:text-neutral-950 [&>svg]:last:hidden',
          },
          selectContent: {
            sideOffset: 9,
          },
        },
      },
    }),
  }
  const canChangePageSize = !!table && !!pageSizeOptions
  const isAnyColumnSortable = table?.getAllFlatColumns().some((column) => column.getCanSort())
  const hasAllTableControl = canChangePageSize && isAnyColumnSortable && !!refresh
  const [isOpenPageSize, setIsOpenPageSize] = useState(false)
  const [sortable, setSortable] = useState<SortingState>([])

  const toggleSortFirstColumn = () => {
    if (!table) return
    const firstColumnId = table.getAllColumns()[0].id
    const currentSort = sortable.find((sorted) => sorted.id === firstColumnId)?.desc

    let nextSort: SortingState = []
    if (currentSort) nextSort = []
    else nextSort = [{ id: firstColumnId, desc: currentSort === undefined ? false : true }]

    setSortable(nextSort)
    table.setSorting(nextSort)
  }

  return (
    <div className='mb-4 flex w-full flex-col gap-4 md:mb-8'>
      {(!!search || !!filter || !!add || !addCustom || !!refresh || !!headerAddon) && (
        <div className='flex items-center gap-4 max-md:flex-col-reverse md:gap-2'>
          {!!search && <TableViewSearch {...search} {...filterMobile} />}

          {(!!filter || !!add || !addCustom || !!refresh || !!headerAddon) && (
            <div className='flex w-full grow justify-end gap-2 max-md:flex-col-reverse md:items-center'>
              {headerAddon}

              {!!filter && (
                <div className='max-md:hidden'>
                  <TableViewFilter {...filter} />
                </div>
              )}

              {!!add && (
                <div className='max-md:rounded-md max-md:bg-red-100 max-md:p-4'>
                  <Button variant='primary' {...add} className={cn('w-full', add.className)}>
                    {add.children ?? (
                      <>
                        <Icon type='plus' /> Tambah
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!!addCustom && (
                <div className='max-md:rounded-md max-md:bg-red-100 max-md:p-4'>{addCustom}</div>
              )}

              {!!refresh && <ButtonRefresh className='max-md:hidden' refresh={refresh} />}
            </div>
          )}
        </div>
      )}

      {(canChangePageSize || isAnyColumnSortable || !!refresh) && (
        <div className='flex items-center justify-end gap-2 md:hidden'>
          {canChangePageSize && (
            <Button
              variant='primary-outline'
              className={cn(
                hasAllTableControl && 'flex-2',
                !hasAllTableControl && 'max-sm:flex-1',
                isOpenPageSize && 'bg-red-800 text-white',
                'whitespace-normal'
              )}
              onClick={() => setIsOpenPageSize((prev) => !prev)}
            >
              Jumlah data per laman
              <ChevronDown className={cn(isOpenPageSize && 'rotate-180')} />
            </Button>
          )}

          {isAnyColumnSortable && (
            <Button
              variant='primary-outline'
              className={cn(hasAllTableControl && 'flex-1', !hasAllTableControl && 'max-sm:flex-1')}
              onClick={() => toggleSortFirstColumn()}
            >
              Urutkan <ChevronsUpDown />
            </Button>
          )}

          {!!refresh && <ButtonRefresh refresh={refresh} />}
        </div>
      )}

      {canChangePageSize && isOpenPageSize && (
        <InputGroup className='md:hidden'>
          <InputGroupAddon>Tampilkan:</InputGroupAddon>
          <SelectPageSize
            {...{ table, pageSizeOptions }}
            className='max-md:w-full max-md:rounded-l-none max-md:border-0 max-md:shadow-none'
          />
        </InputGroup>
      )}
    </div>
  )
}

export { TableViewHeader }
