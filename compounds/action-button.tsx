import type { VariantProps } from 'class-variance-authority'
import type { ModalDialogProps } from '@/components/ui/modal'
import type { buttonVariants } from '@/components/ui/button'
import { Ellipsis } from 'lucide-react'
import { cn, omit } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ModalDelete } from '@/components/ui/modal'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

interface ButtonChildrenProps {
  text?: string
  variant: VariantProps<typeof buttonVariants>['variant']
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  hide?: boolean
  children?: React.ReactNode
}

export interface ActionButtonProps {
  buttonComp?: ButtonChildrenProps[]
  deleteComp?: Omit<ModalDialogProps, 'trigger'> & {
    trigger?: ModalDialogProps['trigger'] & { text?: string }
  }
}

const CategoryActionButton = ({ buttonComp, deleteComp }: ActionButtonProps) => {
  return (
    <div className='md:flex md:gap-2'>
      {buttonComp
        ?.filter(({ hide }) => !hide)
        .map((item, index) => {
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
                  <span className='md:hidden'>{deleteComp.trigger?.text ?? 'Hapus'}</span>
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
    </div>
  )
}

export default function ActionButton({ buttonComp, deleteComp }: ActionButtonProps) {
  return (
    <div>
      {/* DESKTOP */}
      <div className='hidden md:block'>
        <CategoryActionButton {...{ buttonComp, deleteComp }} />
      </div>
      {/* MOBILE */}
      <div
        className={cn(
          'flex md:hidden',
          !buttonComp?.filter((button) => !button.hide).length && !deleteComp && 'hidden'
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button size='icon-xs' variant='primary-outline' className='rounded-full p-2'>
              <Ellipsis />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='p-3'>
            <CategoryActionButton {...{ buttonComp, deleteComp }} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
