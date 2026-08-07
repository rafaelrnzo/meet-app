import type { DbRoom } from '@/lib/api/admin-api'
import type { ResponseNext } from '@/feat/types'
import { djs } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { default as NoData } from '@/components/ui/no-data'
import { JoinRoom } from '@/components/JoinRoom'
import { RoomListHeader } from '@/components/features/rooms/RoomListHeader'
import { RoomList } from '@/components/features/rooms/RoomList'

async function getRoomListConfig(searchParams: object) {
  const session = await auth()
  let initialRooms: DbRoom[] = []
  const isAdmin = session?.roles.name === 'admin'

  const hasPermission = (key: string) => {
    return !!session?.roles?.permissions?.some((perm) => perm.key.endsWith(key))
  }

  if (session) {
    initialRooms = await fetchUserDbRooms(searchParams)
  }

  // Only show if room end date is AFTER today's milisecond
  const rooms = initialRooms.filter((room) => djs(room.end_date).isAfter(djs()))

  return {
    isAdmin,
    hasPermission,
    initialRooms,
    rooms,
    isEmpty: !('search' in searchParams) && !rooms.length,
    isInvalid: 'search' in searchParams && !rooms.length,
  }
}

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
          desc='Silakan buat ruangan baru.'
          className='mt-[min(20vh,200px)]'
        />
      ) : (
        <RoomListHeader isInvalid={isInvalid} headerAddon={`${rooms.length} Daftar Ruangan`} />
      )}
      <RoomList rooms={rooms} isAdmin={isAdmin} canShareLink={hasPermission('room:share')} />
    </PageContainer>
  )
}
