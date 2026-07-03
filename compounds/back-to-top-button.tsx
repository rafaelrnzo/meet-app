'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const MIN_SCROLL_Y = 250

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
        variant='primary'
        className='size-11'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp />
      </Button>
    </div>
  )
}
