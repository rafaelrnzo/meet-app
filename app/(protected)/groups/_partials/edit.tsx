'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import type { SetStateAction } from 'react'
import type { Group, User } from '@/lib/api/admin-api'
import { Modal } from '@/components/ui/modal'
import type { Option } from '@/app/(protected)/groups/_partials/form-controller'
import FormController from '@/app/(protected)/groups/_partials/form-controller'
import { useForm } from '@tanstack/react-form'
import type { InferType } from 'yup'
import { editGroupSchema } from '@/schema/groups'
import { Icon } from '@/components/ui/icon'

interface EditDialogProps {
  isManageOpen: boolean
  setIsManageOpen: React.Dispatch<SetStateAction<boolean>>
  selectedGroup: Group | null
  availableUsers: User[]
  handleAddMember: (e: number[]) => void
  handleRemoveMember: (e: number[]) => void
}

type DisplayParticipants = {
  id: string
  username: string
}

export default function EditDialog({
  isManageOpen: open,
  setIsManageOpen: onOpenChange,
  selectedGroup,
  availableUsers,
  handleAddMember,
  handleRemoveMember,
}: EditDialogProps) {
  ''
  const [displayedParticipants, setDisplayedParticipants] = useState<DisplayParticipants[]>([])
  const [allOptions, setAllOptions] = useState<Option[]>([])
  const [unstoreIds, setUnstoreIds] = useState<number[]>([])
  const [isDisabledAdd, setDisabledAdd] = useState<number[]>([])
  const [stateUpdate, setStateUpdate] = useState<{ state: 'create' | 'remove' | 'idle' }>({
    state: 'idle',
  })

  const groupOption = useMemo(() => {
    return (selectedGroup?.members || []).map((members) => ({
      value: `${members.id}`,
      label: members.username,
    }))
  }, [selectedGroup?.members])

  const availableOption = useMemo(() => {
    return availableUsers
      .filter(({ status }) => status !== 'inactive')
      .map((users) => ({
        value: `${users.id}`,
        label: users.username,
      }))
  }, [availableUsers])

  const mergedOption = useMemo(() => {
    return Array.from(new Set([...groupOption, ...availableOption]))
  }, [availableOption, groupOption])

  const oldParticipants = useMemo(() => {
    return (selectedGroup?.members || []).map((members) => ({
      id: `${members.id}`,
      username: members.username,
    }))
  }, [selectedGroup])

  const filterOptions = useMemo(() => {
    const displayedIds = new Set(displayedParticipants.map((p) => p.id))

    return mergedOption.filter((opt) => !displayedIds.has(opt.value))
  }, [mergedOption, displayedParticipants])

  const defaultValues: InferType<typeof editGroupSchema> = editGroupSchema.getDefault()
  const form = useForm({
    defaultValues,
    validators: {
      onSubmitAsync: editGroupSchema,
    },
    onSubmit: () => {
      if (unstoreIds.length > 0 || displayedParticipants.length > 0) {
        if (unstoreIds.length > 0) {
          handleRemoveMember(unstoreIds.map((ids) => ids))
        }
        if (displayedParticipants.length > 0) {
          handleAddMember(displayedParticipants.map((participant) => Number(participant.id)))
        }
      }
      return
    },
  })

  useEffect(() => {
    if (open === false) {
      form.reset()
      setDisabledAdd([])
      setDisplayedParticipants(oldParticipants)
      setAllOptions(filterOptions)
    }
  }, [form, oldParticipants, open, filterOptions])

  useEffect(() => {
    setDisplayedParticipants(oldParticipants)
  }, [oldParticipants])

  useEffect(() => {
    setAllOptions(filterOptions)
  }, [filterOptions])

  const handleStoreParticipants = (selectedValue: number[]) => {
    setDisabledAdd([])
    setStateUpdate({ state: 'create' })
    const selectedParticipants = new Set(selectedValue.map(String))
    const filterParticipants = filterOptions
      .filter(({ value }) => selectedParticipants.has(value))
      .map((obj) => ({
        id: obj.value,
        username: obj.label,
      }))
    setDisplayedParticipants((prev) => [...prev, ...filterParticipants])
    setAllOptions(filterOptions.filter(({ value }) => !selectedParticipants.has(value)))
  }

  const handleUnstoreParticipants = (ids: string) => {
    setStateUpdate({ state: 'remove' })
    setUnstoreIds((prev) => [...prev, Number(ids)])
    const unstoreParticipants = displayedParticipants.filter((obj) => obj.id !== ids)
    const removedParticipants = displayedParticipants.find(({ id: userId }) => userId === ids)
    setAllOptions((prev) => {
      if (!removedParticipants) return prev
      return [
        ...prev,
        {
          value: removedParticipants.id,
          label: removedParticipants.username,
        },
      ]
    })
    setDisplayedParticipants(unstoreParticipants)
  }

  return (
    <Modal
      root={{ open, onOpenChange, modal: false }}
      title={{
        children: <p className='line-clamp-2 wrap-anywhere'>{selectedGroup?.name}</p>,
      }}
      description={{
        children: 'Tambah atau hapus peserta dari kelompok',
      }}
      submit={{
        children: 'Perbarui Kelompok',
        onClick: () => form.handleSubmit(),
        disabled: stateUpdate.state === 'idle',
      }}
      cancel={{
        children: 'Batal',
      }}
      content={{
        onPointerDownOutside: (e) => e.preventDefault(),
        onInteractOutside: (e) => e.preventDefault(),
        onCloseAutoFocus: (e) => e.preventDefault(),
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const selectedParticipants = form.getFieldValue('user_ids') as number[]
          handleStoreParticipants(selectedParticipants)
        }}
      >
        <div className='block items-end gap-2 md:flex'>
          <FormController
            required
            formApi={form}
            name='user_ids'
            type='combobox'
            label='Tambah peserta kelompok'
            placeholder='Ketik nama peserta di sini...'
            items={allOptions}
            onValueChange={(value) => {
              if (!value) return
              const numbers = (value as { value: number }[]).map((v) => Number(v))
              setDisabledAdd(numbers)
            }}
            buttonProps={{
              disabled: !isDisabledAdd.length,
              children: (
                <>
                  <Icon type='plus' />
                  Tambah Peserta
                </>
              ),
            }}
          />
        </div>
      </form>
      <div className='animate-in fade-in slide-in-from-top-4'>
        <div className='space-y-2'>
          <span className='mb-2 text-sm font-normal text-neutral-950'>
            Peserta saat ini {`(${displayedParticipants.length || 0})`}
          </span>
          <div className='max-h-[281px] overflow-auto'>
            {displayedParticipants.map((member) => (
              <div
                key={member.id}
                className='my-2 flex h-11 items-center justify-between rounded-md border border-neutral-400 bg-white px-3 py-1 shadow-sm'
              >
                <div className='flex items-center gap-3'>
                  <div className='text-primary flex h-8 w-8 items-center justify-center rounded-full border border-neutral-400 bg-transparent text-xs font-medium'>
                    {member.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className='text-sm font-medium'>{member.username}</span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='p-0! hover:bg-transparent'
                  onClick={() => handleUnstoreParticipants(member.id)}
                >
                  <Icon type='close' className='text-error' size={12} />
                </Button>
              </div>
            ))}
            {!displayedParticipants.length && (
              <div className='text-muted-foreground p-8 text-center text-sm'>Tidak ada peserta</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
