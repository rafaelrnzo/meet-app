'use client'

import type { ToasterProps } from 'sonner'
import { Toaster as Sonner, toast as toastDefault } from 'sonner'
import {
  Check,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  X,
  HandIcon,
} from 'lucide-react'
import { cn, omit } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert01Icon, HugeIcon } from '@/components/HugeIcon'

interface ToastProps extends ToasterProps {
  description?: string
  duration?: number
}

type Severity =
  'success' | 'info' | 'error' | 'warning' | 'raise' | 'pick' | 'device' | 'base' | 'record'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='light'
      className='toaster group'
      icons={{
        success: <CircleCheckIcon className='size-4' />,
        info: <InfoIcon className='size-4' />,
        warning: <TriangleAlertIcon className='size-4' />,
        error: <OctagonXIcon className='size-4' />,
        loading: <Loader2Icon className='size-4 animate-spin' />,
      }}
      style={
        {
          width: '400px',
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

const CustomToast = ({
  severity,
  title,
  description,
  ...props
}: ToastProps & {
  severity: Severity
  title?: string
  description: React.ReactNode
}) => {
  const { id, closeButton = true } = props
  const config_template = {
    base: {
      bg: 'bg-rose-50 border border-neutral-300',
      text: 'text-neutral-800 font-medium text-sm',
    },
    success: {
      icon: <Check className='text-success size-5' />,
      bg: 'bg-green-50',
      text: 'text-success',
    },
    info: {
      icon: <InfoIcon className='size-5 text-blue-600' />,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    warning: {
      icon: <TriangleAlertIcon className='size-5 text-yellow-600' />,
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
    },
    error: {
      icon: <X className='text-error size-5' />,
      bg: 'bg-red-50',
      text: 'text-error',
    },
    raise: {
      icon: <HandIcon className='size-4 fill-amber-500 text-amber-500' />,
      bg: 'bg-rose-50 border border-neutral-300',
      text: 'text-neutral-800 font-medium text-sm',
    },
    pick: {
      bg: 'bg-red-200 border border-red-800',
      text: 'text-red-800 font-medium text-base',
    },
    device: {
      icon: <HugeIcon icon={Alert01Icon} size={18} />,
      bg: 'bg-red-200',
      text: 'text-error font-medium text-base',
    },
    record: {
      bg: 'bg-red-200',
      text: 'text-red-800 font-medium text-base',
    },
  }

  const config: { icon?: React.ReactNode; bg: string; text: string } = config_template[severity]

  if (severity === 'base') {
    return (
      <div
        className={cn(
          'relative flex w-[calc(100vw-var(--mobile-offset-left)*2)] max-w-[500px] items-center justify-between gap-3 rounded-xl p-3 shadow-sm',
          config.bg
        )}
      >
        <div className='flex min-w-0 items-center gap-2'>
          <p className={cn('truncate', config.text)}>{title}</p>
        </div>

        <button onClick={() => toastDefault.dismiss(id)} hidden={!closeButton}>
          <X className='h-5 w-5' />
        </button>
      </div>
    )
  }

  if (severity === 'raise') {
    return (
      <div
        className={cn(
          'relative flex w-[calc(100vw-var(--mobile-offset-left)*2)] max-w-[500px] items-center justify-between gap-3 rounded-xl p-3 shadow-sm',
          config.bg
        )}
      >
        <div className='flex min-w-0 items-center gap-2'>
          {config.icon && <div className='shrink-0'>{config.icon}</div>}
          <p className={cn('truncate', config.text)}>{title}</p>
        </div>

        <button onClick={() => toastDefault.dismiss(id)} hidden={!closeButton}>
          <X className='h-5 w-5' />
        </button>
      </div>
    )
  }

  if (severity === 'pick') {
    return (
      <div
        className={cn(
          'flex h-[50px] w-[calc(100vw-var(--mobile-offset-left)*2)] max-w-[500px] justify-between rounded-md p-3 shadow-sm',
          config.bg
        )}
      >
        <div className='flex min-w-0 items-start justify-start gap-2'>
          {config.icon && <div className='shrink-0'>{config.icon}</div>}
          <p className={cn('truncate', config.text)}>{title}</p>
        </div>
        <Button
          onClick={() => toastDefault.dismiss(id)}
          variant='outline'
          className='h-fit border border-black bg-transparent px-2 py-0.75 hover:bg-slate-100/50 active:bg-transparent active:text-black'
        >
          Tutup
        </Button>
      </div>
    )
  }

  if (severity === 'device') {
    return (
      <div className={cn('h-full w-[436px] rounded-md p-3 shadow-sm', config.bg)}>
        <div className='flex min-w-0 gap-2'>
          {config.icon && <div className='text-error'>{config.icon}</div>}
          <p className={cn(config.text)}>{title}</p>
        </div>
      </div>
    )
  }

  if (severity === 'record') {
    return (
      <div className='flex w-[calc(100vw-var(--mobile-offset-left)*2)] max-w-[500px] justify-center'>
        <div className={cn('h-full w-[234px] rounded-md p-3 text-center shadow-sm', config.bg)}>
          <p className={config.text}>{title}</p>
          <p className='text-xs text-neutral-950'>{description}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        `relative flex w-[calc(100vw-var(--mobile-offset-left)*2)] max-w-[500px] items-start justify-between gap-2 rounded-lg border border-neutral-600 p-4 shadow-sm drop-shadow`,
        config.bg
      )}
    >
      <div className='flex items-start gap-2'>
        {config.icon && <div className='mt-1'>{config.icon}</div>}
        <div className='flex-1'>
          <p className={`text-base font-semibold ${config.text}`}>{title}</p>
          <p className='mt-0.5 text-sm text-neutral-600' style={{ lineHeight: '1.2' }}>
            {description}
          </p>
        </div>
      </div>

      <Button
        onClick={() => toastDefault.dismiss(id)}
        variant='outline'
        className='h-fit border border-black bg-transparent px-2 py-0.75 hover:bg-slate-100/50 active:bg-transparent active:text-black'
      >
        Tutup
      </Button>
    </div>
  )
}

const createToast = (severity: Severity) => (title: string, props?: ToastProps) =>
  toastDefault.custom(
    () => (
      <CustomToast
        severity={severity}
        title={title}
        description={props?.description ?? ''}
        {...props}
      />
    ),
    {
      ...omit(props ?? {}, ['description']),
    }
  )

const toast = {
  ...toastDefault,
  base: createToast('base'),
  success: createToast('success'),
  error: createToast('error'),
  info: createToast('info'),
  warning: createToast('warning'),
  raise: createToast('raise'),
  pick: createToast('pick'),
  device: createToast('device'),
  record: createToast('record'),
}

export { Toaster, toast }
