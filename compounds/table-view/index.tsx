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
import { Plus } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import type { TableViewSearchProps } from '@/compounds/table-view/search'
import { TableViewSearch } from '@/compounds/table-view/search'
import type { TableViewFilterProps } from '@/compounds/table-view/filter'
import { TableViewFilter } from '@/compounds/table-view/filter'

type TableViewOptionsAdd = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

interface TableViewProps {
  pageSizeOptions?: number[]
  wrapper?: React.ComponentProps<'div'>
  search?: TableViewSearchProps
  add?: TableViewOptionsAdd
  filter?: TableViewFilterProps
}

export function TableView<TData>({
  columns,
  data,
  pageSizeOptions = ARR_PAGE_SIZE,
  wrapper,
  search,
  add,
  filter,
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
    <div className='@container/table-container space-y-8'>
      {(!!search || !!filter || !!add) && (
        <div className='@container/table-header sm:px-6'>
          <div className='flex items-center gap-2 @max-[496px]/table-header:flex-col-reverse'>
            {!!search && <TableViewSearch {...search} />}

            {(!!filter || !!add) && (
              <div className='flex w-full grow justify-end gap-2 @max-[496px]/table-header:flex-col-reverse'>
                {!!filter && <TableViewFilter {...filter} />}

                {!!add && (
                  <Button variant='primary' {...add}>
                    {add.children ?? (
                      <>
                        <Plus /> Tambah
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
