import type { Column } from '@tanstack/react-table'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableViewColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  className?: HTMLDivElement['className']
  children: React.ReactNode
}

function TableViewColumnHeader<TData, TValue>({
  column,
  className,
  children,
}: TableViewColumnHeaderProps<TData, TValue>) {
  const isDesc = column.getIsSorted() === 'desc'
  const isAsc = column.getIsSorted() === 'asc'
  const Icon = isDesc ? ChevronDown : isAsc ? ChevronUp : ChevronsUpDown

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <div
      className={cn('flex items-center gap-2.5', 'cursor-pointer', className)}
      onClick={() => column.toggleSorting()}
    >
      <span>{children}</span> <Icon size={16} />
    </div>
  )
}

export { TableViewColumnHeader }
