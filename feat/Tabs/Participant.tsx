'use client'

import { useTabsParticipant } from '@/hooks/use-tabs-participant'
import { useParticipantWaitingList } from '@/hooks/use-participant-waiting-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListParticipant, ListParticipantPending } from '@/components/ListParticipant'

export interface HostMessage {
  status: string
  participantName: string
  participants: { participantId: string; participantName: string }[]
}

export const TabsParticipant = () => {
  const { isModerator } = useTabsParticipant()
  const { participantPending, setParticipantPending } = useParticipantWaitingList()

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
            hidden={!isModerator}
          >
            <span>Peserta menunggu</span>
            <span className='bg-error flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold text-white'>
              {participantPending.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className='flex flex-col gap-6'>
          <TabsContent value='all' className='mt-0'>
            <ListParticipant />
          </TabsContent>
          <TabsContent value='waiting' className='mt-0'>
            <ListParticipantPending
              participantPending={participantPending}
              onHandleParticipant={(handledParticipantid) =>
                setParticipantPending((prev) =>
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
