'use client'

import type { SortingState, TableOptions } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ARR_PAGE_SIZE, TableViewPagination } from '@/compounds/table-view/pagination'
import { useState } from 'react'
import { TableViewColumnHeader } from '@/compounds/table-view/column-header'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '@/components/ui/button'
import type { TableViewSearchProps } from '@/compounds/table-view/search'
import type { TableViewFilterProps } from '@/compounds/table-view/filter'
import { TableViewHeader } from '@/compounds/table-view/header'

type TableViewButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

interface TableViewProps {
  pageSizeOptions?: number[]
  wrapper?: React.ComponentProps<'div'>
  search?: TableViewSearchProps
  add?: TableViewButtonProps
  refresh?: TableViewButtonProps
  filter?: TableViewFilterProps
  headerAddon?: React.ReactNode
}

function TableView<TData>({
  columns,
  data,
  pageSizeOptions = ARR_PAGE_SIZE,
  wrapper,
  search,
  add,
  refresh,
  filter,
  headerAddon,
  ...rest
}: Omit<TableOptions<TData>, 'getCoreRowModel'> & TableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })
  const table = useReactTable({
    data,
    columns,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    ...rest,
    state: {
      sorting,
      pagination,
      ...rest.state,
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='@container/table-container flex flex-col gap-4 md:gap-8'>
      <TableViewHeader {...{ search, add, filter, refresh, table, pageSizeOptions, headerAddon }} />
      <div
        {...wrapper}
        className={cn('overflow-hidden rounded-md border border-neutral-200', wrapper?.className)}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='border-neutral-200'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className='h-fit min-h-10 bg-neutral-100 px-2 py-[9.5px]'
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      <TableViewColumnHeader column={header.column} className='text-sm font-medium'>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableViewColumnHeader>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='border-neutral-200'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='px-2 py-[12.5px]'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TableViewPagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  )
}

export type { TableViewButtonProps }
export { TableView }
