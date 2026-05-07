import type { Table } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TableViewPaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions: number[]
}

export const ARR_PAGE_SIZE = [10, 20, 25, 30, 40, 50]

function SelectPageSize<TData>({
  table,
  pageSizeOptions,
  className,
}: TableViewPaginationProps<TData> & {
  className?: React.ComponentProps<typeof SelectTrigger>['className']
}) {
  return (
    <Select
      value={`${table.getState().pagination.pageSize}`}
      onValueChange={(value) => {
        table.setPageSize(Number(value))
      }}
    >
      <SelectTrigger className={cn('h-9 w-20', className)}>
        <SelectValue placeholder={table.getState().pagination.pageSize} />
      </SelectTrigger>
      <SelectContent side='top'>
        {pageSizeOptions.map((pageSize) => (
          <SelectItem key={pageSize} value={`${pageSize}`}>
            {pageSize}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TotalPageInfo<TData>({
  table,
  className,
}: Pick<TableViewPaginationProps<TData>, 'table'> & { className?: HTMLDivElement['className'] }) {
  return (
    <div className={cn('flex w-fit items-center justify-center text-sm', className)}>
      Laman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
    </div>
  )
}

function TableViewPagination<TData>({ table, pageSizeOptions }: TableViewPaginationProps<TData>) {
  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center space-x-4 max-md:hidden'>
        <p className='text-sm'>Jumlah data tabel per laman</p>
        <SelectPageSize {...{ table, pageSizeOptions }} />
      </div>

      <div className='flex space-x-4 max-md:w-full'>
        <TotalPageInfo {...{ table }} className='max-md:hidden' />
        <div className='flex items-center space-x-2 max-md:w-full'>
          <Button
            variant='primary-outline'
            size='icon-sm'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Kembali ke halaman pertama</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant='primary-outline'
            size='icon-sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Kembali ke halaman sebelumnya</span>
            <ChevronLeft />
          </Button>
          <TotalPageInfo {...{ table }} className='flex-1 md:hidden' />
          <Button
            variant='primary-outline'
            size='icon-sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Ke halaman selanjutnya</span>
            <ChevronRight />
          </Button>
          <Button
            variant='primary-outline'
            size='icon-sm'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Ke halaman terakhir</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { TableViewPagination, SelectPageSize }
