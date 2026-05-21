'use client'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AnyFormApi, useForm } from '@tanstack/react-form'
import type { Combobox } from '@/components/ui/combobox'
import InlineCombobox from '@/components/ui/inline-combobox'
import type { Button } from '@/components/ui/button'

export type Option = {
  value: string
  label: string
}

type FormControllerProps =
  | ({ type: 'textarea' } & React.ComponentProps<typeof Textarea>)
  | ({ type: 'text' } & React.ComponentProps<typeof Input>)
  | ({ type: 'combobox' } & React.ComponentProps<typeof Combobox> & {
        placeholder?: string
        items: Option[]
        onValueChange?: (e: number[]) => void
        buttonProps?: React.ComponentProps<typeof Button>
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
              <>
                <InlineCombobox
                  placeholder={placeholder}
                  items={props.items}
                  onValueChange={(values) => {
                    const changed = values.map((v) => Number(v.value))
                    field.handleChange(changed)
                    if (props.onValueChange) props.onValueChange(changed)
                  }}
                  buttonProps={props.buttonProps}
                />
              </>
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
