import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-11 w-full min-w-0 rounded-md border border-neutral-400 bg-transparent px-3 py-1 text-sm shadow transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 disabled:placeholder:text-slate-700 hover:bg-neutral-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        'aria-invalid:ring-red-200 dark:aria-invalid:ring-destructive/40 aria-invalid:border-red-200 aria-invalid:bg-red-200 aria-invalid:text-error',
        'font-normal text-neutral-950 disabled:bg-slate-300 text-md tracking-normal',
        className
      )}
      {...props}
    />
  )
}

export { Input }
