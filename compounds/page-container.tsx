import { Icon } from '@/components/ui/icon'
import { BackToTopButton } from '@/compounds/back-to-top-button'
import { cn } from '@/lib/utils'

interface VariantProps {
  icon: 'room' | 'groups' | 'users' | 'roles' | 'recording'
  title: string
  subTitle: string
  children: React.ReactNode
  backToTopButton?: boolean
  insertAfterTitle?: React.ReactNode
}

export default function PageContainer({
  icon,
  title,
  subTitle,
  children,
  backToTopButton,
  insertAfterTitle,
}: VariantProps) {
  const showedVariant = (type: string) => {
    switch (type) {
      case 'room':
        return <Icon type='video' className='size-5 text-red-800' />
      case 'groups':
        return <Icon type='gift' className='size-5 text-red-800' />
      case 'users':
        return <Icon type='users' className='size-5 text-red-800' />
      case 'roles':
        return <Icon type='shield-half' className='size-5 text-red-800' />
      case 'recording':
        return <Icon type='play-circle' className='size-5 text-red-800' />
    }
  }
  return (
    <div>
      {backToTopButton && <BackToTopButton />}
      <div
        className={cn(
          !insertAfterTitle && 'hidden',
          'mb-8 grid-cols-1 rounded-lg bg-red-100 p-6 md:flex md:items-center md:justify-between'
        )}
      >
        <div className='hidden w-full sm:items-center sm:gap-6 md:flex md:max-w-[50%] md:flex-row'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-red-800 bg-red-50'>
            {showedVariant(icon)}
          </div>
          <div className='flex-1 text-center wrap-anywhere md:text-left'>
            <h2 className='text-base font-semibold text-red-800'>{title}</h2>
            <p className='text-sm text-neutral-950'>{subTitle}</p>
          </div>
        </div>
        <div className='w-full justify-end md:max-w-[50%] lg:flex lg:justify-end'>
          {insertAfterTitle}
        </div>
      </div>
      {children}
    </div>
  )
}
