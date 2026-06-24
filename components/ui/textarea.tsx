import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 aria-invalid:text-error flex field-sizing-content min-h-16 w-full rounded-md border border-neutral-400 bg-transparent px-2 py-1 text-sm font-normal tracking-normal text-neutral-950 shadow transition-[color,box-shadow] outline-none hover:bg-neutral-50 focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 disabled:placeholder:text-slate-700 aria-invalid:border-red-200 aria-invalid:bg-red-200 aria-invalid:ring-red-200',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
