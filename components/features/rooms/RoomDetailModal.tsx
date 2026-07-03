'use client'

import type { TabsValue } from '@/feat/rooms/dto'
import type { RoomContentsProps } from '@/components/features/rooms/RoomContents'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import {
  AccordionContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { OverviewContent, ParticipantsContent } from '@/components/features/rooms/RoomContents'

export default function RoomDetailModal({ overview, participants, settings }: RoomContentsProps) {
  const {
    activeRoom,
    room,
    files,
    maxFile: MAX_FILE,
    handleUploadFile,
    handleRemoveFile,
  } = overview
  const {
    allParticipants,
    searchParticipants,
    filterParticipants,
    onClose,
    setIsOpenBlock,
    setUserIdentity,
  } = participants
  const { setIsOpenDelete } = settings
  const [activeAccor, setActiveAccor] = useState<TabsValue>('overview')

  return (
    <div>
      <Accordion type='single' collapsible defaultValue={activeAccor} className='max-w-lg'>
        <AccordionItem value='overview' className='my-2' onClick={() => setActiveAccor('overview')}>
          <AccordionTrigger
            className={buttonVariants({
              variant: activeAccor === 'overview' ? 'primary' : 'destructive-light',
              size: 'default',
              className: '[&>svg]:hidden',
            })}
          >
            Ringkasan Ruangan
          </AccordionTrigger>
          <AccordionContent>
            <OverviewContent
              {...{
                room,
                activeRoom,
                files,
                maxFile: MAX_FILE,
                handleUploadFile,
                handleRemoveFile,
              }}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='participants' className='my-2'>
          <AccordionTrigger
            className={buttonVariants({
              variant: 'primary',
              size: 'default',
              className: '[&>svg]:hidden',
            })}
          >
            Akses dan Peserta Ruangan
          </AccordionTrigger>
          <AccordionContent>
            <ParticipantsContent
              {...{
                allParticipants,
                searchParticipants,
                filterParticipants,
                onClose,
                setIsOpenBlock,
                setUserIdentity,
              }}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='settings' className='my-2'>
          <AccordionTrigger
            onClick={() => {
              onClose()
              setIsOpenDelete(true)
            }}
            className={buttonVariants({
              variant: 'primary',
              size: 'default',
              className: '[&>svg]:hidden',
            })}
          >
            Pengaturan Ruangan
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
