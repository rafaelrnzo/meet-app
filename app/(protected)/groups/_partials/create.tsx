'use client'

import { useEffect, useState } from 'react'
import type { SetStateAction } from 'react'
import { Modal } from '@/components/ui/modal'
import FormController from '@/app/(protected)/groups/_partials/form-controller'
import { useForm } from '@tanstack/react-form'
import { createGroupsSchema } from '@/schema/groups'
import type { InferType } from 'yup'
import { Plus } from 'lucide-react'
import type { Group } from '@/lib/api/admin-api'

interface CreateDialogProps {
  isCreateOpen: boolean
  setIsCreateOpen: React.Dispatch<SetStateAction<boolean>>
  handleCreate: (val: Pick<Group, 'name' | 'description'>) => void
}
export function CreateDialog({
  isCreateOpen: open,
  setIsCreateOpen: onOpenChange,
  handleCreate,
}: CreateDialogProps) {
  const [desc, setDesc] = useState('')
  const defaultValues: InferType<typeof createGroupsSchema> = createGroupsSchema.getDefault()
  const form = useForm({
    defaultValues,
    validators: {
      onSubmitAsync: createGroupsSchema,
    },
    onSubmit: ({ value }) => {
      handleCreate(value)
    },
  })

  useEffect(() => {
    if (open === false) {
      form.reset()
      setDesc('')
    }
  }, [form, open])

  return (
    <Modal
      root={{ open, onOpenChange }}
      submit={{
        children: (
          <>
            <Plus /> Tambah Kelompok
          </>
        ),
        onClick: () => form.handleSubmit(),
      }}
      cancel={{
        children: 'Batal',
      }}
      title={{
        children: 'Tambah kelompok',
      }}
      description={{
        children: 'Buat kelompok untuk mengatur anggota.',
      }}
    >
      <FormController
        required
        formApi={form}
        name='name'
        type='text'
        label='Nama kelompok'
        placeholder='Contoh: kelompok pimpinan'
      />
      <FormController
        formApi={form}
        name='description'
        type='textarea'
        label='Deskripsi kelompok'
        placeholder='Contoh: kelompok ini khusus berisi pimpinan'
        listeners={{
          onChange: ({ value }) => setDesc(String(value)),
        }}
        subLabel={`${desc.length} / 255 karakter.`}
      />
    </Modal>
  )
}
