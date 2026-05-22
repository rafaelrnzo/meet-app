import { BackToTopButton } from '@/compounds/back-to-top-button'
import { cn } from '@/lib/utils'
import { Play, Video, Gift, Users, ShieldHalf } from 'lucide-react'

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
        return <Video className='size-5 text-red-800' />
      case 'groups':
        return <Gift className='size-5 text-red-800' />
      case 'users':
        return <Users className='size-5 text-red-800' />
      case 'roles':
        return <ShieldHalf className='size-5 text-red-800' />
      case 'recording':
        return <Play className='size-5 fill-white text-white' />
    }
  }
  return (
    <div>
      {backToTopButton && <BackToTopButton />}
      <div
        className={cn(
          !insertAfterTitle && 'hidden',
          'mb-8 grid-cols-1 rounded-lg bg-red-100 p-6 md:grid md:grid-cols-2 md:items-center md:justify-between'
        )}
      >
        <div className='hidden sm:items-center sm:gap-6 md:flex md:flex-row'>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-red-800 bg-red-50'>
            {showedVariant(icon)}
          </div>
          <div className='flex-1 text-center md:text-left'>
            <h2 className='text-base font-semibold text-red-800'>{title}</h2>
            <p className='text-sm text-neutral-950'>{subTitle}</p>
          </div>
        </div>
        <div className='flex justify-center md:justify-end'>{insertAfterTitle}</div>
      </div>
      {children}
    </div>
  )
}
