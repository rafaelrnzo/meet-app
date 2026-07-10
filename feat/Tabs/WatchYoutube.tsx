'use client'

import type { FC } from 'react'
import { useTabsYoutube } from '@/hooks'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const TabsWatchYoutube: FC = () => {
  const { url, isPlayed, preventUpdate, match, urlRef, isStartSharingRef, setUrl, setIsPlayed } =
    useTabsYoutube()

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-base font-semibold text-neutral-400'>
        Tampilkan tautan Youtube untuk ditonton bersama
      </p>
      <Input
        type='search'
        value={url}
        name='watch-youtube'
        disabled={isPlayed}
        autoComplete='off'
        onChange={(e) => {
          urlRef.current = e.target.value.trim()
          setUrl(e.target.value)
        }}
        placeholder='Tempelkan tautan Youtube di sini...'
      />
      <Button
        className='w-full'
        variant='primary'
        onClick={() => {
          isStartSharingRef.current = true
          setIsPlayed((prev) => !prev)
        }}
        disabled={preventUpdate || !match}
      >
        {isPlayed ? 'Berhenti Berbagi' : 'Mulai Berbagi'}
      </Button>
    </div>
  )
}
