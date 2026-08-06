'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

interface NoDataProps {
  title: string
  desc?: string
  reload?: boolean
  goBack?: boolean
  insertButton?: {
    children: React.ReactNode
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
      <div className='max-w-[384px] md:min-w-[384px]'>
        <div className='mb-2 flex justify-center'>
          <div className='flex size-12 items-center justify-center rounded-md border-none border-neutral-400 bg-red-200 p-3'>
            <Icon type='close' className={cn(classNameIcon, 'size-6 text-red-500')} />
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
            className='mb-3 w-full'
            onClick={() => window.location.reload()}
          >
            Muat ulang laman
          </Button>
        )}
        {goBack && (
          <Button
            variant={reload ? 'secondary-outline' : 'primary'}
            className='mb-3 w-full'
            onClick={() => router.push('/')}
          >
            {reload ? 'Kembali ke Beranda' : 'Masuk ke Beranda'}
          </Button>
        )}
        {insertButton && (
          <Button variant='primary' onClick={insertButton.onClick} className='mb-3 w-full'>
            {insertButton.children ?? 'Buat'}
          </Button>
        )}
      </div>
    </div>
  )
}
