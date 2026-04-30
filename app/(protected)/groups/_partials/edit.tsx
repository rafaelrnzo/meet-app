'use client'

import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import type { SetStateAction } from 'react'
import type { Group, UserResponse } from '@/lib/api/admin-api'
import { Modal } from '@/components/ui/modal'
import FormController from '@/app/(protected)/groups/_partials/form-controller'
import { useForm } from '@tanstack/react-form'
import type { InferType } from 'yup'
import { editGroupSchema } from '@/schema/groups'

interface EditDialogProps {
  isManageOpen: boolean
  setIsManageOpen: React.Dispatch<SetStateAction<boolean>>
  selectedGroup: Group | null
  selectedUserId: string
  setSelectedUserId: React.Dispatch<SetStateAction<string>>
  availableUsers: UserResponse[]
  handleAddMember: () => void
  handleRemoveMember: (e: number) => void
}

export default function EditDialog({
  isManageOpen: open,
  setIsManageOpen: onOpenChange,
  selectedGroup,
  selectedUserId,
  setSelectedUserId,
  availableUsers,
  handleAddMember,
  handleRemoveMember,
}: EditDialogProps) {
  const defaultValues: InferType<typeof editGroupSchema> = editGroupSchema.getDefault()
  const form = useForm({
    defaultValues,
    validators: {
      onSubmitAsync: editGroupSchema,
    },
    onSubmit: () => {
      handleAddMember()
      console.log('value', selectedUserId)
    },
  })

  return (
    <Modal
      root={{ open, onOpenChange }}
      title={{
        children: 'Atur anggota',
      }}
      description={{
        children: 'Tambah atau hapus anggota dari kelompok',
      }}
      close={{
        onClick: () => form.reset(),
      }}
      footer={{
        hidden: true,
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className='block items-end gap-2 md:flex'>
          <FormController
            required
            formApi={form}
            name='user_id'
            type='combobox'
            label='Tambah Anggota'
            placeholder='Ketik nama anggota di sini...'
            value={selectedUserId}
            onValueChange={(val) => setSelectedUserId(val)}
            items={availableUsers.map((users) => ({
              value: String(users.id),
              label: users.username,
            }))}
          />
          <Button variant='primary' type='submit' className='mb-4 w-full md:w-fit'>
            <Plus /> Tambah Anggota
          </Button>
        </div>
      </form>
      <div>
        <div className='space-y-2'>
          <span className='mb-2 text-sm font-normal text-neutral-950'>
            Anggota saat ini {`(${selectedGroup?.members?.length || 0})`}
          </span>
          <div className='max-h-[125px] overflow-auto'>
            {selectedGroup?.members?.map((member) => (
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
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <X className='text-error h-4 w-4' />
                </Button>
              </div>
            ))}
            {!selectedGroup?.members?.length && (
              <div className='text-muted-foreground p-8 text-center text-sm'>
                No members in this group.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
