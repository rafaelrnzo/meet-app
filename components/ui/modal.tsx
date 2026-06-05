'use client'

import { useState } from 'react'
import type { DialogCloseProps } from '@radix-ui/react-dialog'
import { DialogPortal } from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@/components/ui/icon'

interface ModalDialogProps {
  root?: React.ComponentProps<typeof Dialog>
  content?: React.ComponentProps<typeof DialogContent>
  trigger?: React.ComponentProps<typeof DialogTrigger>
  header?: React.ComponentProps<typeof DialogHeader>
  title?: React.ComponentProps<typeof DialogTitle>
  description?: React.ComponentProps<typeof DialogDescription>
  footer?: React.ComponentProps<typeof DialogFooter>
  cancel?: React.ComponentProps<typeof Button>
  submit?: React.ComponentProps<typeof Button>
  children?: React.ReactNode
  scroller?: React.ComponentProps<'div'>
}

interface ModalProps extends ModalDialogProps {
  close?: DialogCloseProps
}

function Modal({
  root,
  content,
  trigger,
  header,
  title,
  description,
  footer,
  cancel,
  submit,
  children,
  scroller,
  close,
}: ModalProps) {
  const [loading, setLoading] = useState(false)
  const attributeName = 'data-modal-prevented'

  const isPrevented = () => document.body.hasAttribute(attributeName)
  const contentClosedInterceptor = (
    cbName: 'onEscapeKeyDown' | 'onInteractOutside' | 'onPointerDownOutside'
  ) => {
    return <T extends Event>(event: T) => {
      if (isPrevented()) {
        return event.preventDefault()
      }

      if (event.defaultPrevented) {
        return
      }

      content?.[cbName]?.(event as never)
    }
  }

  const submitInterceptor = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const onClickCallback = submit?.onClick?.(event) as any

    // Do not submit if event.preventDefault, or no click handler, or its not a promise
    if (event.defaultPrevented || !onClickCallback || !(onClickCallback instanceof Promise)) {
      return
    }

    // Stop closing modal - state before the promise is done
    document.body.setAttribute(attributeName, '')
    setLoading(true)

    await Promise.resolve(onClickCallback)

    setLoading(false)
    document.body.removeAttribute(attributeName)
  }

  return (
    <Dialog {...root}>
      <DialogTrigger {...trigger} />
      <DialogPortal>
        <DialogContent
          {...content}
          data-without-x
          className={cn(
            'group peer max-h-[calc(100vh-32px)] gap-0 rounded-md border-0 p-0 max-sm:max-w-[calc(100vw-32px)]',
            content?.className
          )}
          onEscapeKeyDown={contentClosedInterceptor('onEscapeKeyDown')}
          onInteractOutside={contentClosedInterceptor('onInteractOutside')}
          onPointerDownOutside={contentClosedInterceptor('onPointerDownOutside')}
        >
          <div
            {...scroller}
            className={cn(
              'max-h-[inherit] max-w-[inherit] overflow-y-auto rounded-tl-lg rounded-tr-lg',
              scroller?.className
            )}
          >
            <DialogHeader {...header} className={cn('space-y-0 p-5', header?.className)}>
              <div className='flex justify-between'>
                <DialogTitle
                  {...title}
                  className={cn(
                    header?.children && 'sr-only',
                    'mb-0 flex items-center py-[5.5px] text-base leading-5.25 font-semibold text-red-800 capitalize',
                    title?.className
                  )}
                />
                {header?.children}
                {!header?.children && (
                  <DialogClose
                    {...close}
                    className={cn(close?.hidden && 'hidden')}
                    onClick={(event) => {
                      close?.onClick?.(event)

                      if (!event.defaultPrevented && isPrevented()) {
                        event.preventDefault()
                      }
                    }}
                    asChild
                  >
                    <Button className='bg-red-200 hover:bg-red-300/70'>
                      <Icon type='close' className='text-red-500' />
                      <span className='sr-only'>Close</span>
                    </Button>
                  </DialogClose>
                )}
              </div>
              <DialogDescription
                {...description}
                className={cn(
                  'flex flex-col text-left text-sm text-neutral-950',
                  !description?.children && 'hidden',
                  description?.className
                )}
              />
            </DialogHeader>
            <Separator className='bg-neutral-400' />
            <div className='my-2 p-5'>{children}</div>
            <Separator
              className={cn(
                'bg-neutral-400',
                ((submit?.hidden && cancel?.hidden) || footer?.hidden) && 'hidden'
              )}
            />
            <DialogFooter
              {...footer}
              className={cn(
                'gap-2 p-5',
                submit?.hidden && cancel?.hidden && 'hidden',
                footer?.className
              )}
            >
              {footer?.children ?? (
                <>
                  <DialogClose asChild>
                    <Button
                      {...cancel}
                      className={cn(
                        'mr-0 border-neutral-950 px-6 py-[9.5px] text-neutral-950 sm:w-fit',
                        cancel?.className
                      )}
                      variant='outline'
                      onClick={(event) => {
                        cancel?.onClick?.(event)

                        if (!event.defaultPrevented && isPrevented()) {
                          event.preventDefault()
                        }
                      }}
                    >
                      {cancel?.children ?? 'Cancel'}
                    </Button>
                  </DialogClose>
                  <Button
                    {...submit}
                    className={cn(
                      'bg-red-800 px-6 py-[9.5px] text-white sm:w-fit',
                      submit?.className
                    )}
                    disabled={submit?.disabled || loading}
                    onClick={submitInterceptor}
                  >
                    {loading && <Spinner />}
                    {submit?.children ?? 'Save changes'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
        {root?.modal === false && (
          <div className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50' />
        )}
      </DialogPortal>
    </Dialog>
  )
}

function ModalDelete({ submit, title, children, cancel, footer, content, ...rest }: ModalProps) {
  return (
    <Modal
      {...rest}
      submit={{
        ...submit,
        className: cn(
          'sm:w-full bg-red-200 text-red-500 hover:bg-red-300/70 cursor-pointer',
          submit?.className
        ),
      }}
      cancel={{
        ...cancel,
        className: cn('sm:w-full', cancel?.className),
      }}
      title={{
        ...title,
        className: cn('text-red-500', title?.className),
      }}
      children={<div className='text-sm text-slate-600'>{children}</div>}
      footer={{
        ...footer,
        className: cn('items-center sm:flex-col sm:flex-col-reverse', footer?.className),
      }}
      content={{
        ...content,
        className: cn('w-80', content?.className),
        onPointerDownOutside: (e) => e.preventDefault(),
        onInteractOutside: (e) => e.preventDefault(),
      }}
    />
  )
}

export { Modal, ModalDelete, type ModalDialogProps }
