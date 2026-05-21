'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { AnyFormApi } from '@tanstack/react-form'
import { useForm, useStore } from '@tanstack/react-form'
import { Modal } from '@/components/ui/modal'
import { Eye, EyeClosed, Plus, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { defaultErrorMessage } from '@/config'

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

type GroupOptions = SelectOptions & { totalMember: number }

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
  const [users, setUsers] = useState<User[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [queryParams, setQueryParams] = useState<ParamsUserAssignment>({})
  const isActiveRoom = useMemo(
    () => !!activeRooms.find((ar) => ar.name === initialData?.room_code),
    [activeRooms, initialData?.room_code]
  )
  const activeParticipant = useMemo(
    () => activeRooms.find((ar) => ar.name === initialData?.room_code)?.num_participants,
    [activeRooms, initialData?.room_code]
  )
  const defaultValues: RoomSchemaValue = initialData
    ? getRoomDefaultValue(initialData)
    : roomSchema().getDefault()

  const form = useForm({
    defaultValues,
    validators: {
      onChangeAsync: roomSchema({
        isLive: isActiveRoom,
        activeParticipant,
        isEdit: !!initialData,
      }),
    },
    onSubmit: async ({ value, formApi }: { value: RoomSchemaValue; formApi: AnyFormApi }) => {
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
        onSuccess()
        formApi.reset()
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : defaultErrorMessage
        toast.error(initialData ? 'Gagal memperbarui ruang rapat' : 'Gagal membuat ruang rapat', {
          description: message,
        })
      }
    },
  })

  const isSubmittingForm = useStore(form.store, (state) => state.isSubmitting)
  const maxParticipants = useStore(form.store, (state) => state.values.maxParticipants)
  const remainingParticipant = useStore(form.store, (state) => {
    const { assignedTo, maxParticipants, totalGroupMember } = state.values
    const remainingParticipant = (maxParticipants ?? 0) - (assignedTo.length + totalGroupMember)
    return remainingParticipant > 0 ? remainingParticipant : 0
  })

  const fetchUsers = async (params?: ParamsUserAssignment, signal?: AbortSignal) => {
    try {
      const response = await fetchUsersAssignment(params, signal)
      setUsers(response)
    } catch (error) {
      if (error instanceof DOMException && error.name == 'AbortError') {
        return
      }
      setUsers([])
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchUsers(queryParams, controller.signal)
    return () => {
      controller.abort()
    }
  }, [queryParams])

  useEffect(() => {
    setQueryParams(initialData ? { exclude_group_id: initialData.group_id } : {})
  }, [initialData])

  const handleGetTotalGroupMember = useCallback(
    (id: number) => groups.find((item) => item.id === id)?.members?.length ?? 0,
    [groups]
  )

  return (
    <Modal
      title={{ children: initialData ? 'Perbarui Ruangan' : 'Buat Ruangan Baru' }}
      root={{
        open,
        onOpenChange: (val) => {
          onOpenChange(val)
          form.reset()
          setShowPassword(false)
          setQueryParams({})
        },
        modal: false,
      }}
      description={{ children: 'Kelola Ruangan Anda.' }}
      cancel={{
        children: 'Batal',
      }}
      content={{
        className: 'max-w-[700px]!',
        onInteractOutside: (event) => event.preventDefault(),
        onCloseAutoFocus: (event) => event.preventDefault(),
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
          <form.Field
            name='groupId'
            listeners={{
              onChange: ({ value, fieldApi }) => {
                const totalGroupMember = handleGetTotalGroupMember(+value)
                fieldApi.form.setFieldValue('totalGroupMember', totalGroupMember)
                if (value) {
                  fieldApi.form.setFieldValue('assignedTo', [])
                }
              },
              onMount: ({ fieldApi, value }) => {
                const totalGroupMember = handleGetTotalGroupMember(+value)
                fieldApi.form.setFieldValue('totalGroupMember', totalGroupMember)
              },
            }}
            validators={{ onChangeListenTo: ['maxParticipants', 'assignedTo'] }}
          >
            {(field) => {
              const { name, state, handleChange } = field
              const { value: defaultValue, meta } = state
              const { errors, isTouched } = meta
              const isInvalid = isTouched && errors.length > 0
              const options: GroupOptions[] = groups.map((item) => ({
                value: `${item.id}`,
                label: item.name,
                totalMember: item.members?.length ?? 0,
              }))
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
                      setQueryParams((prev) =>
                        val
                          ? { ...prev, exclude_group_id: +val.value }
                          : omit(prev, ['exclude_group_id'])
                      )
                    }}
                  >
                    <ComboboxInput
                      aria-invalid={isInvalid}
                      placeholder='Pilih kelompok ...'
                      showClear={!!value.value}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>Tidak ada data.</ComboboxEmpty>
                      <ComboboxList>
                        {(group: GroupOptions) => (
                          <ComboboxItem
                            key={group.value}
                            value={group}
                            className='flex items-center justify-between gap-2.5'
                          >
                            <span>{group.label.trim() || '-'}</span>
                            <span>{group.totalMember}</span>
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
                    onChange={(event) => {
                      handleChange(+event.target.value)
                      form.setFieldMeta('groupId', (meta) => ({
                        ...meta,
                        isTouched: true,
                      }))
                      form.setFieldMeta('assignedTo', (meta) => ({
                        ...meta,
                        isTouched: true,
                      }))
                    }}
                    placeholder='Contoh: 20'
                    aria-invalid={isInvalid}
                  />
                </FormField>
              )
            }}
          </form.Field>
        </Field>

        <form.Field
          name='assignedTo'
          validators={{ onChangeListenTo: ['maxParticipants', 'groupId'] }}
        >
          {(field) => {
            const { name, state, handleChange } = field
            const { value, meta } = state
            const { errors, isTouched } = meta
            const isInvalid = isTouched && errors.length > 0
            const isCheckedAll = users.every((user) => value.includes(`${user.id}`))
            const uncheckedUser = users.filter((user) => !value.includes(`${user.id}`)).length

            return (
              <FormField
                label='Pilih anggota untuk dimasukkan ke ruang rapat'
                {...{ name, isInvalid, errors }}
              >
                <TableViewSearch
                  placeholder='Cari anggota ...'
                  onSearch={({ value: search }) => setQueryParams((prev) => ({ ...prev, search }))}
                />
                <Card className='rounded-md'>
                  <CardContent className='flex min-h-[113px] flex-col px-2 pt-1 pb-3.5'>
                    {/* TODO: buat reusable */}
                    {!users.length ? (
                      <div className='flex flex-1 flex-col items-center justify-center gap-2 text-lg font-semibold text-red-800'>
                        <div
                          className={cn(
                            buttonVariants({
                              variant: 'secondary-outline',
                            }),
                            'size-12 cursor-default hover:bg-white'
                          )}
                        >
                          <X className='size-6 text-red-800' />
                        </div>
                        Tidak Ada Anggota
                      </div>
                    ) : (
                      <>
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
                              handleChange((prev) =>
                                prev.filter((userId) => !allUser.includes(userId))
                              )
                            }}
                            disabled={
                              !users.length ||
                              (!!maxParticipants &&
                                uncheckedUser > remainingParticipant &&
                                !isCheckedAll)
                            }
                            checked={isCheckedAll}
                          />
                          <Label htmlFor='all' className='w-full opacity-100!'>
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
                                  handleChange((prev) =>
                                    prev.filter((item) => item !== `${user.id}`)
                                  )
                                }}
                                disabled={
                                  !!maxParticipants &&
                                  !remainingParticipant &&
                                  !value.includes(`${user.id}`)
                                }
                              />
                              <Label htmlFor={`${user.id}`} className='w-full opacity-100!'>
                                {user.username}
                              </Label>
                            </Field>
                          ))}
                        </div>
                      </>
                    )}
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
