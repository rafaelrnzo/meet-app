import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive px-4 py-2",
  {
    variants: {
      variant: {
        primary: 'bg-red-800 text-white hover:bg-red-900',
        'primary-outline':
          'bg-red-50 hover:bg-red-200 active:bg-red-800 border border-red-800 text-red-800 active:text-white disabled:bg-neutral-50 disabled:border-neutral-400 disabled:text-stone-400 disabled:opacity-100',
        default: 'bg-slate-950 text-white',
        outline:
          'bg-neutral-50 border border-slate-950 text-slate-950 hover:bg-neutral-200 active:bg-neutral-950 active:text-neutral-50',
        destructive:
          'bg-red-200 text-error hover:bg-red-300 active:bg-error active:text-neutral-50',
        'destructive-light':
          'bg-red-50 text-error hover:bg-red-200 active:bg-error active:text-neutral-50',
        secondary:
          'bg-neutral-50 border border-neutral-400 text-neutral-400 hover:border-red-800 hover:text-red-800 active:bg-red-800 active:text-neutral-50 disabled:border-neutral-400 disabled:bg-neutral-400 disabled:text-neutral-50 disabled:opacity-100',
        'secondary-ghost':
          'text-neutral-400 hover:bg-red-50 hover:text-red-800 active:bg-red-800 active:text-neutral-50',
        'secondary-light':
          'bg-neutral-50 text-neutral-950 hover:bg-neutral-200 active:bg-neutral-950 active:text-neutral-50',
        'secondary-outline':
          'bg-white border border-neutral-400 text-neutral-950 disabled:bg-neutral-200 disabled:border-neutral-400 disabled:text-neutral-400 disabled:opacity-100 hover:bg-neutral-50 active:bg-neutral-200',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11',
        sm: 'h-9',
        lg: 'h-10 px-6 py-[9.5px]',
        icon: 'size-11',
        'icon-xs': 'size-6',
        'icon-sm': 'size-9',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(
        buttonVariants({ variant, size, className }),
        (children.props as { className?: string }).className
      ),
    })
  }

  return (
    <button {...props} className={cn(buttonVariants({ variant, size, className }))}>
      {children}
    </button>
  )
}

export { Button, buttonVariants }
