'use client'

import type { InferType } from 'yup'
import type { SetStateAction } from 'react'
import type { Group } from '@/lib/api/admin-api'
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createGroupsSchema } from '@/schema/groups'
import { Modal } from '@/components/ui/modal'
import { Icon } from '@/components/ui/icon'
import { default as FormController } from '@/app/(protected)/groups/_partials/form-controller'

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
      root={{
        open,
        onOpenChange,
      }}
      submit={{
        children: (
          <>
            <Icon type='plus' /> Tambah Kelompok
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
      content={{
        onPointerDownOutside: (e) => e.preventDefault(),
        onInteractOutside: (e) => e.preventDefault(),
        onCloseAutoFocus: (e) => e.preventDefault(),
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
        maxLength={250}
        subLabel={`${desc.length} / 250 karakter.`}
      />
    </Modal>
  )
}
