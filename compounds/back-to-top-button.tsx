'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

const MIN_SCROLL_Y = 300

export function BackToTopButton() {
  const [scrollY, setScrollY] = useState<number>(0)

  const getWindowScroll = () => {
    setScrollY(window.scrollY)
  }

  useEffect(() => {
    window.addEventListener('scroll', getWindowScroll)
    return () => window.removeEventListener('scroll', getWindowScroll)
  }, [])

  return (
    <div className={cn('fixed right-6 bottom-6 z-50', scrollY <= MIN_SCROLL_Y && 'hidden')}>
      <Button
        asChild
        variant='primary'
        className='flex size-10 items-center justify-center rounded-md p-3 text-center text-white'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp />
      </Button>
    </div>
  )
}
