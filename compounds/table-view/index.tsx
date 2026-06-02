'use client'

import type { Row, RowData, SortingState, TableOptions } from '@tanstack/react-table'
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
import { useMemo, useState } from 'react'
import { TableViewColumnHeader } from '@/compounds/table-view/column-header'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from '@/components/ui/button'
import type { TableViewSearchProps } from '@/compounds/table-view/search'
import type { TableViewFilterProps } from '@/compounds/table-view/filter'
import { TableViewHeader } from '@/compounds/table-view/header'
import { Skeleton } from '@/components/ui/skeleton'

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
  loading?: boolean
}

function isAlphabet(charCode: number) {
  return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)
}

function charCategory(charCode: number) {
  // special character
  if (
    (charCode >= 32 && charCode <= 47) || // !"#$%&'()*+,-./ (include space)
    (charCode >= 58 && charCode <= 64) || // :;<=>?@
    (charCode >= 91 && charCode <= 96) || // [\]^_`
    (charCode >= 123 && charCode <= 126) // {|}~
  ) {
    return 0
  }

  // numeric
  if (charCode >= 48 && charCode <= 57) {
    return 1
  }

  // alphabet
  if (isAlphabet(charCode)) {
    return 2
  }

  //other
  return 3
}

function handleSort<TData extends RowData>(rowA: Row<TData>, rowB: Row<TData>, columnId: string) {
  const textA = rowA.getValue<string>(columnId) ?? ''
  const textB = rowB.getValue<string>(columnId) ?? ''
  const minTextLength = Math.min(textA.length, textB.length)

  for (let i = 0; i < minTextLength; i++) {
    const codeA = textA.charCodeAt(i)
    const codeB = textB.charCodeAt(i)

    // both charcode are same
    if (codeA === codeB) continue

    const categoryA = charCategory(codeA)
    const categoryB = charCategory(codeB)

    // different category (special char = 0 | numeric = 1 | alphabet = 2 | other = 3)
    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }

    // same category but not alphabet
    if (categoryA !== 2) {
      return codeA - codeB
    }

    // convert both to uppercase alphabet code
    const upperA = codeA >= 97 && codeA <= 122 ? codeA - 32 : codeA
    const upperB = codeB >= 97 && codeB <= 122 ? codeB - 32 : codeB

    // different alphabet
    if (upperA !== upperB) {
      return upperA - upperB
    }

    return codeA - codeB
  }

  return textA.length - textB.length
}

function TableView<TData>({
  columns: defaultColumns,
  data: defaultData,
  pageSizeOptions = ARR_PAGE_SIZE,
  wrapper,
  search,
  add,
  refresh,
  filter,
  headerAddon,
  loading = false,
  ...rest
}: Omit<TableOptions<TData>, 'getCoreRowModel'> & TableViewProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
  })
  const data = useMemo(
    () => (loading ? Array<TData>(4).fill({} as TData) : defaultData),
    [defaultData, loading]
  )
  const columns = useMemo(
    () =>
      loading
        ? defaultColumns.map((column) => ({
            ...column,
            cell: () => <Skeleton className='h-6.5 w-full' />,
          }))
        : defaultColumns,
    [defaultColumns, loading]
  )
  const table = useReactTable({
    data,
    columns,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    defaultColumn: {
      sortingFn: handleSort,
    },
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
