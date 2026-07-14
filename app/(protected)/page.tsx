import type { ResponseNext } from '@/feat/types'
import { getRoomListConfig } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { default as NoData } from '@/components/ui/no-data'
import { JoinRoom } from '@/components/JoinRoom'
import { RoomListHeader } from '@/components/features/rooms/RoomListHeader'
import { RoomList } from '@/components/features/rooms/RoomList'

export default async function HomePage(props: ResponseNext) {
  const { isAdmin, isEmpty, isInvalid, rooms, hasPermission } = await getRoomListConfig(
    await props.searchParams
  )

  return (
    <PageContainer
      icon='room'
      title='Beranda'
      subTitle='Bergabung dalam ruangan secara instan'
      backToTopButton
      insertAfterTitle={<JoinRoom rooms={rooms} />}
    >
      {isEmpty ? (
        <NoData
          title='Tidak Ada Ruangan yang Tersedia'
          desc='Ruangan yang sedang berlangsung akan muncul disini.'
          className='mt-[min(20vh,200px)]'
        />
      ) : (
        <RoomListHeader isInvalid={isInvalid} headerAddon={`${rooms.length} Daftar Ruangan`} />
      )}
      <RoomList rooms={rooms} isAdmin={isAdmin} canShareLink={hasPermission('room:share')} />
    </PageContainer>
  )
}
