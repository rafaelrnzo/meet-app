'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ActiveRoom, DbRoom, Group, ParamsUserAssignment, User } from '@/lib/api/admin-api'
import { createDbRoom, fetchUsersAssignment, updateDbRoom } from '@/lib/api/admin-api'
import { TableViewSearch } from '@/compounds/table-view/search'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn, omit } from '@/lib/utils'
import { CalendarWithTime } from '@/components/ui/calendar-with-time'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getRoomDefaultValue, getRoomPayload } from '@/feat/rooms/dto'
import type { RoomSchemaValue, SelectOptions } from '@/feat/rooms/dto'
import { roomSchema } from '@/feat/rooms/schema'
import { useForm, useStore } from '@tanstack/react-form'
import { Modal } from '@/components/ui/modal'
import { Eye, EyeClosed, Plus } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toast } from 'sonner'

interface RoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: DbRoom | null
  groups: Group[]
  activeRooms: ActiveRoom[]
}

interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  children: React.ReactNode
  isInvalid?: boolean
  errors?: ({ message?: string } | undefined)[]
  className?: HTMLDivElement['className']
}

const FormField = (props: FormFieldProps) => {
  const {
    name,
    label,
    required = false,
    children,
    isInvalid = false,
    errors = [],
    className,
  } = props
  return (
    <Field orientation='vertical' className={cn('flex flex-col gap-2', className)}>
      <FieldLabel htmlFor={name} className='gap-1'>
        {label} {required && <span className='text-destructive'>*</span>}
      </FieldLabel>
      {children}
      {isInvalid && errors && <FieldError errors={errors} className='text-error text-xs' />}
    </Field>
  )
}

export function RoomForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  groups,
  activeRooms,
}: RoomFormProps) {
  const defaultValues: RoomSchemaValue = initialData
    ? getRoomDefaultValue(initialData)
    : roomSchema.getDefault()

  const form = useForm({
    defaultValues,
    validators: {
      onChangeAsync: roomSchema,
    },
    onSubmit: async ({ value }: { value: RoomSchemaValue }) => {
      const payload = getRoomPayload(value)
      try {
        if (initialData) {
          await updateDbRoom(initialData.id, payload)
        } else {
          await createDbRoom(payload)
        }
        toast.success(`Ruang rapat berhasil ${initialData ? 'diperbarui' : 'dibuat'}`, {
          description: `Ruang rapat ${payload.name} berhasil ${initialData ? 'diperbarui' : 'dibuat'}`,
        })
        onOpenChange(false)
        form.reset()
        onSuccess()
      } catch (error) {
        toast.error(`Gagal ${initialData ? 'memperbarui' : 'membuat'} ruang rapat`, {
          description:
            error instanceof Error
              ? error?.message
              : 'Ada kendala dari sistem, mohon tunggu sebentar atau coba muat ulang laman',
        })
      }
    },
  })

  const [users, setUsers] = useState<User[]>([])
  const params = useRef<ParamsUserAssignment>({})
  const [showPassword, setShowPassword] = useState(false)
  const isSubmittingForm = useStore(form.store, (state) => state.isSubmitting)
  const isActiveRoom = useMemo(
    () => !!activeRooms.find((ar) => ar.name === initialData?.room_code),
    [activeRooms, initialData?.room_code]
  ) // TODO: cek apakah ini realtime update setelah useRealTimeRooms sudah bisa update active room

  const fetchUsers = async (params?: ParamsUserAssignment) => {
    try {
      const response = await fetchUsersAssignment(params)
      setUsers(response)
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    fetchUsers(initialData ? { exclude_group_id: initialData.group_id } : {})
  }, [initialData])

  return (
    <Modal
      title={{ children: initialData ? 'Perbarui Ruangan' : 'Buat Ruangan Baru' }}
      root={{
        open,
        onOpenChange: (val) => {
          onOpenChange(val)
          form.reset()
          setShowPassword(false)
        },
        modal: false,
      }}
      description={{ children: 'Kelola Ruangan Anda.' }}
      cancel={{
        children: 'Batal',
      }}
      content={{
        className: 'max-w-[700px]!',
      }}
      submit={{
        children: initialData ? (
          'Perbarui Ruangan'
        ) : (
          <>
            <Plus />
            Tambah Ruangan
          </>
        ),
        onClick: async () => await form.handleSubmit(),
        disabled: isSubmittingForm,
      }}
    >
      <div className='space-y-4'>
        <form.Field name='name'>
          {(field) => {
            const { name, state, handleChange } = field
            const { value = '', meta } = state
            const { errors, isTouched } = meta
            const isInvalid = isTouched && errors.length > 0

            return (
              <FormField label='Nama ruangan' required {...{ name, isInvalid, errors }}>
                <Input
                  id={name}
                  {...{ name, value }}
                  type='text'
                  onChange={(event) => handleChange(event.target.value)}
                  autoFocus
                  placeholder='Contoh: Ruangan pimpinan'
                  aria-invalid={isInvalid}
                  autoComplete='off'
                  aria-autocomplete='none'
                />
              </FormField>
            )
          }}
        </form.Field>

        <form.Field name='description'>
          {(field) => {
            const { name, state, handleChange } = field
            const { value = '', meta } = state
            const { errors, isTouched } = meta
            const isInvalid = isTouched && errors.length > 0

            return (
              <FormField {...{ name }} label='Deskripsi ruangan'>
                <Textarea
                  id={name}
                  {...{ name, value }}
                  onChange={(event) => handleChange(event.target.value)}
                  placeholder='Contoh: Ruangan ini khusus untuk pimpinan'
                  aria-invalid={isInvalid}
                  maxLength={250}
                />
                <FieldDescription className={cn('text-xs', isInvalid && 'text-error')}>
                  {`${value.length} / 250 Karakter.`}
                </FieldDescription>
              </FormField>
            )
          }}
        </form.Field>

        <Field orientation='horizontal' className='items-start max-[519px]:flex-col'>
          <form.Field name='startDate'>
            {(field) => {
              const { name, state, handleChange } = field
              const { value, meta } = state
              const { errors, isTouched } = meta
              const isInvalid = isTouched && errors.length > 0

              return (
                <FormField label='Waktu mulai' required {...{ name, isInvalid, errors }}>
                  <CalendarWithTime
                    id={name}
                    {...{ name }}
                    selected={{
                      startTime: value ?? undefined,
                      endTime: field.form.state.values.endDate ?? undefined,
                    }}
                    onSelect={({ startTime, endTime }) => {
                      handleChange(startTime ? startTime : null)
                      field.form.setFieldValue('endDate', endTime ?? null)
                    }}
                    aria-invalid={isInvalid}
                    calendar={{
                      disabled: {
                        before: new Date(),
                      },
                    }}
                    disabled={isActiveRoom}
                  />
                </FormField>
              )
            }}
          </form.Field>

          <form.Field name='password'>
            {(field) => {
              const { name, state, handleChange } = field
              const { value = '', meta } = state
              const { errors, isTouched } = meta
              const isInvalid = isTouched && errors.length > 0

              return (
                <FormField label='Kata sandi ruangan (Opsional)' {...{ name, isInvalid, errors }}>
                  <InputGroup>
                    <InputGroupInput
                      id={name}
                      {...{ name, value }}
                      type={showPassword ? 'text' : 'password'}
                      onChange={(event) => handleChange(event.target.value)}
                      placeholder='Contoh: @ruanganpimpinan1'
                      aria-invalid={isInvalid}
                      autoComplete='new-password'
                      aria-autocomplete='none'
                    />
                    <InputGroupAddon
                      align='inline-end'
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='cursor-pointer'
                    >
                      {showPassword ? <EyeClosed /> : <Eye />}
                    </InputGroupAddon>
                  </InputGroup>
                </FormField>
              )
            }}
          </form.Field>
        </Field>

        <Field orientation='horizontal' className='items-start max-[519px]:flex-col'>
          <form.Field name='groupId'>
            {(field) => {
              const { name, state, handleChange } = field
              const { value: defaultValue, meta } = state
              const { errors, isTouched } = meta
              const isInvalid = isTouched && errors.length > 0
              const options = groups.map((item) => ({ value: `${item.id}`, label: item.name }))
              const value = options.find((item) => item.value === defaultValue) ?? {
                value: '',
                label: '',
              }

              return (
                <FormField label='Kelompok' {...{ name, isInvalid, errors }}>
                  <Combobox
                    items={options}
                    itemToStringValue={(group: SelectOptions) => group.label}
                    {...{ value }}
                    onValueChange={(val) => {
                      handleChange(val?.value ?? '')
                      const updateParams = {
                        ...omit(params.current, ['exclude_group_id']),
                        ...(val ? { exclude_group_id: +val.value } : {}),
                      }
                      params.current = updateParams
                      fetchUsers(updateParams)
                      field.form.setFieldValue('assignedTo', [])
                    }}
                  >
                    <ComboboxInput placeholder='Pilih kelompok ...' showClear={!!value.value} />
                    <ComboboxContent>
                      <ComboboxEmpty>Tidak ada data.</ComboboxEmpty>
                      <ComboboxList>
                        {(group) => (
                          <ComboboxItem key={group.value} value={group}>
                            {group.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormField>
              )
            }}
          </form.Field>

          <form.Field name='maxParticipants'>
            {(field) => {
              const { name, state, handleChange } = field
              const { value, meta } = state
              const { errors, isTouched } = meta
              const isInvalid = isTouched && errors.length > 0

              return (
                <FormField label='Maksimal anggota' required {...{ name, isInvalid, errors }}>
                  <Input
                    id={name}
                    type='number'
                    {...{ name }}
                    value={`${value ?? ''}`}
                    onChange={(event) => handleChange(+event.target.value)}
                    placeholder='Contoh: 20'
                    aria-invalid={isInvalid}
                  />
                </FormField>
              )
            }}
          </form.Field>
        </Field>

        <form.Field name='assignedTo'>
          {(field) => {
            const { name, state, handleChange } = field
            const { value, meta } = state
            const { errors, isTouched } = meta
            const isInvalid = isTouched && errors.length > 0
            const assignTo = field.form.state.values.assignedTo

            return (
              <FormField
                label='Pilih anggota untuk dimasukkan ke ruang rapat'
                {...{ name, isInvalid, errors }}
              >
                <TableViewSearch
                  placeholder='Cari anggota ...'
                  onSearch={({ value: search }) => {
                    const updateParams = { ...params.current, search }
                    params.current = updateParams
                    fetchUsers(updateParams)
                  }}
                />
                <Card className='rounded-md'>
                  <CardContent className='px-2 pt-1 pb-3.5'>
                    <Field orientation='horizontal'>
                      <Checkbox
                        id='all'
                        name='all'
                        onCheckedChange={(val) => {
                          const allUser = users.map((user) => `${user.id}`)
                          if (val) {
                            handleChange((prev) => [...new Set([...prev, ...allUser])])
                            return
                          }
                          handleChange((prev) => prev.filter((userId) => !allUser.includes(userId)))
                        }}
                        disabled={!users.length}
                        checked={users.every((user) => assignTo.includes(`${user.id}`))}
                      />
                      <Label htmlFor='all' className='w-full'>
                        All
                      </Label>
                    </Field>
                    <Separator className='my-2' />
                    <div className='grid max-h-[113px] grid-cols-2 gap-2 overflow-y-auto'>
                      {users.map((user) => (
                        <Field key={user.id} orientation='horizontal'>
                          <Checkbox
                            id={`${user.id}`}
                            name={name}
                            checked={value.includes(`${user.id}`)}
                            onCheckedChange={() => {
                              if (!value.includes(`${user.id}`)) {
                                handleChange((prev) => [...prev, `${user.id}`])
                                return
                              }
                              handleChange((prev) => prev.filter((item) => item !== `${user.id}`))
                            }}
                          />
                          <Label htmlFor={`${user.id}`} className='w-full'>
                            {user.username}
                          </Label>
                        </Field>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FormField>
            )
          }}
        </form.Field>

        <form.Field name='isMuteOnStart'>
          {(field) => {
            const { name, state, handleChange } = field
            const { value, meta } = state
            const { errors, isTouched } = meta
            const isInvalid = isTouched && errors.length > 0

            return (
              <FormField
                label='Semua anggota tidak dapat menggunakan mikrofon di dalam ruangan'
                {...{ name, isInvalid, errors }}
                className='sm:w-[calc(50%-4px)]'
              >
                <FieldLabel className='border-neutral-400 has-data-[state=checked]:border-neutral-400 has-data-[state=checked]:bg-transparent'>
                  <Field orientation='horizontal' className='items-center! px-3! py-2!'>
                    <Checkbox
                      id={name}
                      {...{ name }}
                      checked={value}
                      onCheckedChange={(val) =>
                        handleChange(typeof val === 'boolean' ? val : false)
                      }
                    />
                    <FieldContent>
                      <FieldTitle>Bisukan mikrofon semua anggota</FieldTitle>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </FormField>
            )
          }}
        </form.Field>
      </div>
    </Modal>
  )
}
