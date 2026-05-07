'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ActiveSwitchProps {
  label?: {
    active: string
    inactive: string
  }
  checked?: boolean
  onCheckedChange?: React.Dispatch<React.SetStateAction<boolean>>
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

const SwitchCustomizationDemo = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    icon?: React.ReactNode
    thumbClassName?: string
  }
>(({ className, icon, thumbClassName, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-success inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0.5 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-red-200',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'bg-background data-[state=unchecked]:bg-error pointer-events-none flex size-5 items-center justify-center rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        thumbClassName
      )}
    >
      {icon ? icon : null}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
SwitchCustomizationDemo.displayName = SwitchPrimitives.Root.displayName

const ActiveSwitch = ({
  label = {
    active: '',
    inactive: '',
  },
  checked,
  onCheckedChange,
}: ActiveSwitchProps) => {
  return (
    <div
      className={cn(
        checked ? 'bg-green-50' : 'bg-red-50',
        'my-1 flex h-11 w-full cursor-pointer items-center justify-start gap-2 rounded-md px-2 py-1 md:my-0 md:h-6 md:w-11 md:justify-center md:p-0'
      )}
    >
      <SwitchCustomizationDemo
        checked={checked}
        className='h-7 w-12'
        icon={
          checked ? (
            <Check className='text-success h-4 w-4' />
          ) : (
            <X className='h-4 w-4 text-white' />
          )
        }
        onCheckedChange={onCheckedChange}
        thumbClassName='data-[state=checked]:translate-x-5'
      />
      <Label className={cn(checked ? 'text-success' : 'text-error', 'cursor-pointer md:hidden')}>
        {checked ? label.active : label?.inactive}
      </Label>
    </div>
  )
}

export { Switch, ActiveSwitch, type ActiveSwitchProps }
