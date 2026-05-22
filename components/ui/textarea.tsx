import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30  border-neutral-400 bg-transparent px-2 py-1 text-md shadow tracking-normal disabled:placeholder:text-slate-700 hover:bg-neutral-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 font-normal text-neutral-950 disabled:bg-slate-300 text-md aria-invalid:ring-red-200 dark:aria-invalid:ring-destructive/40 aria-invalid:border-red-200 aria-invalid:bg-red-200 aria-invalid:text-error",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
