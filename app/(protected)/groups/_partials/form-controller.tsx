'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AnyFormApi, useForm } from '@tanstack/react-form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'

type FormControllerProps =
  | ({ type: 'textarea' } & React.ComponentProps<typeof Textarea>)
  | ({ type: 'text' } & React.ComponentProps<typeof Input>)
  | ({ type: 'combobox' } & React.ComponentProps<typeof Select> & {
        placeholder?: string
        items: { value: string; label: string }[]
      })

type FormProps = {
  label: string
  name: ReturnType<typeof useForm>['Field']['name']
  formApi: AnyFormApi
  subLabel?: string
  listeners?: Parameters<ReturnType<typeof useForm>['Field']>[0]['listeners']
}

export default function FormController({
  label,
  name,
  formApi,
  subLabel,
  listeners,
  ...props
}: FormProps & FormControllerProps) {
  const { type, required, placeholder } = props
  const form = formApi as unknown as ReturnType<typeof useForm>

  return (
    <form.Field name={name} listeners={listeners}>
      {(field) => {
        return (
          <Field orientation='vertical' className='mb-4'>
            <FieldLabel htmlFor={field.name} className='font-normal text-neutral-950'>
              {label}
              {required && <span className='text-destructive'>*</span>}
            </FieldLabel>
            {type === 'textarea' ? (
              <Textarea
                value={(field.state.value as string) ?? ''}
                name={field.name}
                onChange={(e) => field.handleChange(e.target.value)}
                className='border border-neutral-400 shadow-sm'
                {...props}
              />
            ) : type === 'combobox' ? (
              <Select {...props}>
                <SelectTrigger className='h-11 cursor-pointer border border-neutral-400 shadow-sm focus:ring-0 focus:ring-offset-0'>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className='data-[side=bottom]:slide-in-from-top-0! data-[side=left]:slide-in-from-right-0! data-[side=right]:slide-in-from-left-0! data-[side=top]:slide-in-from-bottom-0! max-h-28'>
                  <SelectGroup>
                    {props.items?.map(({ value, label }) => {
                      return (
                        <SelectItem
                          className='my-2 cursor-pointer px-3 py-1'
                          key={value}
                          value={value}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='text-primary flex h-8 w-8 items-center justify-center rounded-full border border-neutral-400 bg-transparent text-xs font-medium'>
                              {label.substring(0, 2).toUpperCase()}
                            </div>
                            <span className='text-sm font-medium'>{label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={(field.state.value as string) ?? ''}
                name={field.name}
                onChange={(e) => field.handleChange(e.target.value)}
                className='shadow-sm'
                {...props}
              />
            )}
            {subLabel && <span className='text-xs font-normal text-neutral-400'>{subLabel}</span>}
            {field.state.meta.errors && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}
