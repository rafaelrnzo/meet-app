'use client'

import type { FC } from 'react'
import { useTabsSettingsRecording } from '@/hooks'

export const TabsSettingsRecordings: FC = () => {
  const { recordings } = useTabsSettingsRecording()

  return (
    <div className='space-y-4'>
      {recordings.map(({ id, name, durationFormatted }) => (
        <div key={id}>
          <div className='font-medium text-red-800'>{name}</div>
          <div className='text-xs text-neutral-400'>Durasi rekaman: {durationFormatted}</div>
        </div>
      ))}
    </div>
  )
}
