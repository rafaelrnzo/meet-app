import type { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { ModalDialogProps } from '@/components/ui/modal'
import { Modal, ModalDelete } from '@/components/ui/modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { ActiveSwitchProps } from '@/components/ui/switch'
import { ActiveSwitch } from '@/components/ui/switch'
import { omit } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import { Ellipsis } from 'lucide-react'
import React, { useState } from 'react'

interface ButtonChildrenProps {
  text?: string
  variant: VariantProps<typeof buttonVariants>['variant']
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export interface ActionButtonProps {
  buttonComp?: ButtonChildrenProps[]
  deleteComp?: Omit<ModalDialogProps, 'trigger'> & {
    trigger?: ModalDialogProps['trigger'] & { text?: string }
  }
  switchComp?: Pick<ActiveSwitchProps, 'checked'> & {
    text?: {
      active: string
      inactive: string
    }
    modal?: ModalDialogProps
    setChecked: React.Dispatch<React.SetStateAction<boolean>>
  }
}

const CategoryActionButton = ({ buttonComp, deleteComp, switchComp }: ActionButtonProps) => {
  const [open, onOpenChange] = useState(false)

  return (
    <div className='md:flex md:gap-2'>
      {buttonComp?.map((item, index) => {
        return (
          <Button
            key={index}
            variant={item.variant}
            size='icon-xs'
            className='my-1 h-11 w-full justify-start px-2 py-1 md:my-0 md:size-6 md:justify-center md:p-0'
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.children ?? (
              <>
                {item.icon} <span className='block md:hidden'>{item.text}</span>
              </>
            )}
          </Button>
        )
      })}
      {deleteComp && (
        <ModalDelete
          {...omit(deleteComp, ['description'])}
          trigger={{
            ...deleteComp?.trigger,
            ...((!deleteComp.trigger?.asChild || !deleteComp.trigger?.children) && {
              asChild: true,
              children: (
                <Button
                  title='Delete'
                  variant='destructive-light'
                  size='icon-xs'
                  className='my-1 h-11 w-full justify-start px-2 py-1 md:my-0 md:size-6 md:justify-center md:p-0'
                >
                  <Icon type='trash' />
                  <span className='md:hidden'>{deleteComp.trigger?.text}</span>
                </Button>
              ),
            }),
          }}
          submit={{
            ...deleteComp.submit,
            children: (
              <>
                <Icon type='trash' />
                {deleteComp.submit?.children}
              </>
            ),
          }}
          cancel={{
            ...deleteComp.cancel,
            children: 'Batal',
          }}
        >
          {deleteComp.description?.children}
        </ModalDelete>
      )}
      {switchComp && (
        <Modal
          {...switchComp.modal}
          title={{
            className: 'text-red-500!',
            ...switchComp.modal?.title,
          }}
          root={{ open, onOpenChange }}
          cancel={{
            className: 'w-full!',
            ...switchComp.modal?.cancel,
            ...(!switchComp.modal?.cancel?.onClick && {
              onClick: () => switchComp.setChecked(true),
            }),
          }}
          submit={{
            className: 'w-full! bg-red-200 text-red-500 hover:bg-red-300/70 cursor-pointer',
            ...switchComp.modal?.submit,
          }}
          close={{
            onClick: () => switchComp.setChecked(true),
          }}
          footer={{
            className: 'w-full items-center sm:flex-col sm:flex-col-reverse',
          }}
          content={{
            className: 'w-80',
          }}
          trigger={{
            ...switchComp.modal?.trigger,
            ...((!switchComp.modal?.trigger?.asChild || !switchComp.modal?.trigger?.children) && {
              asChild: true,
              children: (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    switchComp.setChecked(!switchComp.checked)
                    if (switchComp.checked === true) {
                      onOpenChange(true)
                    }
                  }}
                >
                  <ActiveSwitch
                    checked={switchComp.checked}
                    onCheckedChange={(value) => {
                      switchComp.setChecked(value)
                      if (value === false) {
                        onOpenChange(true)
                      }
                    }}
                    label={{
                      active: switchComp.text?.active ?? '',
                      inactive: switchComp.text?.inactive ?? '',
                    }}
                  />
                </div>
              ),
            }),
          }}
        >
          {switchComp.modal?.description?.children}
        </Modal>
      )}
    </div>
  )
}

export default function ActionButton({ buttonComp, deleteComp, switchComp }: ActionButtonProps) {
  return (
    <div>
      {/* DESKTOP */}
      <div className='hidden md:block'>
        <CategoryActionButton {...{ buttonComp, deleteComp, switchComp }} />
      </div>
      {/* MOBILE */}
      <div className='flex md:hidden'>
        <Popover>
          <PopoverTrigger asChild>
            <Button size='icon-xs' variant='primary-outline' className='rounded-full p-2'>
              <Ellipsis />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='p-3'>
            <CategoryActionButton {...{ buttonComp, deleteComp, switchComp }} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
