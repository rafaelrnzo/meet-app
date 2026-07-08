'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { qstring } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListParticipant, ListParticipantPending } from '@/components/ListParticipant'

export interface HostMessage {
  status: string
  participantName: string
  participants: { participantId: string; participantName: string }[]
}

export const TabsParticipant = () => {
  const { name: roomName } = useParams<{ name: string }>()
  const [pending, setPending] = useState<HostMessage['participants']>([])
  const { data: session } = useSession()

  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '') + '/api/waiting-rooms/hosts'
    const es = new EventSource(
      qstring(url, { room_code: roomName, token: session?.access_token }, { skipEmpty: true })
    )

    es.onmessage = (e: MessageEvent<string>) => {
      const { status, participants: pending }: HostMessage = JSON.parse(e.data)
      const triggerEvents = ['initial-waiting', 'waiting', 'waiting-updated']

      if (!triggerEvents.includes(status)) {
        return
      }
      setPending(pending)
    }

    return () => es.close()
  }, [roomName, session?.access_token])

  return (
    <div className='mx-auto w-full max-w-2xl bg-white p-4'>
      <Tabs defaultValue='all' className='w-full'>
        <TabsList className='mb-6 flex h-auto justify-start gap-6 rounded-none border-gray-100 bg-transparent p-0'>
          <TabsTrigger
            value='all'
            className='rounded-none border-b-2 border-transparent bg-transparent p-0 pb-2 text-sm text-gray-400 shadow-none transition-all hover:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-transparent data-[state=active]:border-b-red-800 data-[state=active]:bg-transparent data-[state=active]:text-red-800 data-[state=active]:shadow-none!'
          >
            Semua peserta
          </TabsTrigger>

          <TabsTrigger
            value='waiting'
            className='flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent p-0 pb-2 text-sm text-gray-400 shadow-none transition-all hover:text-gray-600 data-[state=active]:border-b-2 data-[state=active]:border-transparent data-[state=active]:border-b-red-800 data-[state=active]:bg-transparent data-[state=active]:text-red-800 data-[state=active]:shadow-none!'
          >
            <span>Peserta menunggu</span>
            <span className='bg-error flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold text-white'>
              {pending.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className='flex flex-col gap-6'>
          <TabsContent value='all' className='mt-0'>
            <ListParticipant />
          </TabsContent>
          <TabsContent value='waiting' className='mt-0'>
            <ListParticipantPending
              participantPending={pending}
              onHandleParticipant={(handledParticipantid) =>
                setPending((prev) =>
                  prev.filter(({ participantId }) => participantId !== handledParticipantid)
                )
              }
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
