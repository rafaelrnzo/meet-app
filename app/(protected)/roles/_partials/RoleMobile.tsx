'use client'
import type { AnyFormApi } from '@tanstack/react-form'
import type { GroupedPermission } from '@/app/(protected)/roles/_partials/RoleContents'
import type { AccorValue } from '@/app/(protected)/roles/_partials/RoleCheckbox'
import type { RoleTabsValue } from '@/app/(protected)/roles/_partials/edit'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import {
  AccordionContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ControlDashboardContents,
  ControlMeetContents,
} from '@/app/(protected)/roles/_partials/RoleContents'

const RoleClientAccor = ({
  isMobile,
  activeAccor,
  children,
}: {
  isMobile: boolean
  activeAccor: AccorValue
  children: React.ReactNode
}) => {
  if (isMobile) {
    return (
      <Accordion type='single' collapsible defaultValue={activeAccor}>
        {children}
      </Accordion>
    )
  }
  return children
}

const RoleParentAccor = ({
  groupedPermissions,
  formApi,
  isUser,
}: {
  groupedPermissions: GroupedPermission
  formApi: AnyFormApi
  isUser?: boolean
}) => {
  const [activeAccor, setActiveAccor] = useState<RoleTabsValue>('control_dashboard')
  return (
    <div>
      {isUser ? (
        <ControlMeetContents {...{ groupedPermissions, formApi, isUser: true }} />
      ) : (
        <Accordion type='single' collapsible defaultValue={activeAccor}>
          <AccordionItem
            value='control_dashboard'
            className='my-2'
            onClick={() => setActiveAccor('control_dashboard')}
          >
            <AccordionTrigger
              className={buttonVariants({
                variant: 'primary',
                size: 'default',
                className: '[&>svg]:hidden',
              })}
            >
              Manajemen Izin Menu Dashboard
            </AccordionTrigger>
            <AccordionContent>
              <ControlDashboardContents {...{ groupedPermissions, formApi }} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='control_meet' className='my-2'>
            <AccordionTrigger
              className={buttonVariants({
                variant: 'primary',
                size: 'default',
                className: '[&>svg]:hidden',
              })}
            >
              Manajemen Izin Kontrol Ruangan Rapat
            </AccordionTrigger>
            <AccordionContent>
              <ControlMeetContents {...{ groupedPermissions, formApi }} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}

export { RoleParentAccor, RoleClientAccor }
