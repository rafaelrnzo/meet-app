'use client'

import type { SetStateAction } from 'react'
import type { Role } from '@/lib/api/admin-api'
import type { RoleContentsProps } from '@/app/(protected)/roles/_partials/RoleContents'
import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useIsMobile } from '@/hooks/use-mobile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { default as RoleTabs } from '@/app/(protected)/roles/_partials/RoleTabs'
import { RoleParentAccor } from '@/app/(protected)/roles/_partials/RoleMobile'
import { ControlMeetContents } from '@/app/(protected)/roles/_partials/RoleContents'

export type RoleTabsValue = 'control_dashboard' | 'control_meet'

interface EditRolesProps extends Pick<RoleContentsProps, 'groupedPermissions'> {
  isManageOpen: boolean
  setIsManageOpen: React.Dispatch<SetStateAction<boolean>>
  selectedRole: Role | null
  handleAddPermissions: (e: number[]) => void
}

export default function EditRoles({
  isManageOpen: open,
  setIsManageOpen: onOpenChange,
  selectedRole,
  groupedPermissions,
  handleAddPermissions,
}: EditRolesProps) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<RoleTabsValue>('control_dashboard')
  const roleName = selectedRole?.name
  const rename = roleName
    ? roleName === 'user'
      ? 'Peserta'
      : roleName === 'admin'
        ? 'Super admin'
        : roleName.charAt(0).toUpperCase() + roleName.slice(1)
    : ''

  const tabsTrigger: RoleTabsValue[] = ['control_dashboard', 'control_meet']
  const form = useForm({
    defaultValues: {
      permissions: selectedRole?.permissions?.map(({ ID }) => ID) ?? [],
    },
    onSubmit: ({ value }) => handleAddPermissions(value.permissions),
  })

  useEffect(() => {
    if (open === false) {
      setActiveTab('control_dashboard')
    }
  }, [open])

  return (
    <Modal
      root={{ open, onOpenChange, modal: false }}
      title={{
        children: <p className='line-clamp-2 wrap-anywhere'>Kelola izin - {rename}</p>,
      }}
      description={{
        children: 'Perbarui izin dari setiap peserta badiklat',
      }}
      submit={{
        children: 'Berikan izin',
        onClick: () => form.handleSubmit(),
      }}
      cancel={{
        children: 'Batal',
        onClick: () => form.reset(),
      }}
      content={{
        onPointerDownOutside: (e) => e.preventDefault(),
        onInteractOutside: (e) => e.preventDefault(),
        onCloseAutoFocus: (e) => e.preventDefault(),
        className: 'max-w-[1170px]',
      }}
      close={{
        onClick: () => form.reset(),
      }}
    >
      {isMobile ? (
        <RoleParentAccor
          {...{
            groupedPermissions,
            formApi: form,
            isUser: selectedRole?.name === 'user',
          }}
        />
      ) : selectedRole?.name === 'moderator' ? (
        <Tabs
          defaultValue={activeTab}
          className='h-full overflow-auto'
          onValueChange={(tabs) => setActiveTab(tabs as RoleTabsValue)}
        >
          <TabsList variant='line'>
            {tabsTrigger.map((tabs) => (
              <TabsTrigger
                key={tabs}
                value={tabs}
                className='cursor-pointer rounded-none text-sm font-medium text-neutral-400 hover:text-red-800 data-[state=active]:border-b-2 data-[state=active]:border-b-red-800 data-[state=active]:text-red-800 data-[state=active]:after:opacity-0!'
              >
                {tabs === 'control_dashboard'
                  ? 'Manajemen Izin Menu Dashboard'
                  : 'Manajemen Izin Kontrol Ruangan Rapat'}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab}>
            <RoleTabs
              {...{
                activeTab,
                groupedPermissions,
                selectedRole,
                formApi: form,
              }}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ControlMeetContents
          {...{ groupedPermissions, formApi: form, isUser: selectedRole?.name === 'user' }}
        />
      )}
    </Modal>
  )
}
