'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface NoDataProps {
  title: string
  desc?: string
  reload?: boolean
  goBack?: boolean
  insertButton?: {
    text: string
    onClick: () => void
  }
  className?: string
  classNameIcon?: string
}

export default function NoData({
  title,
  desc,
  reload,
  goBack,
  insertButton,
  className,
  classNameIcon,
}: NoDataProps) {
  const router = useRouter()
  return (
    <div className={cn(className, 'flex items-center justify-center text-center')}>
      <div className='max-w-[384px] min-w-[384px]'>
        <div className='mb-2 flex justify-center'>
          <div className='flex size-12 items-center justify-center rounded-md border border-neutral-400 p-3'>
            <Icon type='close' className={cn(classNameIcon, 'size-6 text-red-800')} />
          </div>
        </div>
        <div className='mb-2'>
          <span className='text-lg font-medium text-red-800'>{title}</span>
        </div>
        {desc && (
          <div className='mb-6'>
            <span className='text-sm font-normal text-neutral-400'>{desc}</span>
          </div>
        )}
        {reload && (
          <Button
            variant='primary'
            className='mb-3 h-8 w-full border-none px-3 py-[5.5px] font-semibold'
            onClick={() => window.location.reload()}
          >
            Muat ulang laman
          </Button>
        )}
        {goBack && (
          <Button
            className={cn(
              reload
                ? 'border border-neutral-400 bg-transparent text-slate-950'
                : 'bg-red-800 text-white',
              'mb-3 h-8 w-full rounded-md px-3 py-[5.5px] font-semibold'
            )}
            onClick={() => router.push('/')}
          >
            {reload ? 'Kembali ke Beranda' : 'Masuk ke Beranda'}
          </Button>
        )}
        {insertButton && <Button onClick={insertButton.onClick}>{insertButton.text}</Button>}
      </div>
    </div>
  )
}
