'use client'

import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'

export function BackToTopButton() {
  return (
    <div className='fixed right-6 bottom-6 z-50'>
      <Button
        asChild
        variant='primary'
        className='flex h-14 w-14 items-center justify-center rounded-lg text-center text-white'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp />
      </Button>
    </div>
  )
}
