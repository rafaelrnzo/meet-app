import type { ActiveRoom, DbRoom } from '@/lib/api/admin-api'
import type { ResponseNext } from '@/feat/types'
import { auth } from '@/lib/auth'
import { fetchActiveRooms, fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { RoomListHeader } from '@/components/RoomListHeader'
import { JoinRoom } from '@/components/JoinRoom'
import { RoomList } from '@/components/features/rooms/RoomList'

export default async function HomePage(props: ResponseNext) {
  const session = await auth()
  const searchParams = await props.searchParams
  const isAdmin = session?.roles.name === 'admin'
  const hasPermission = session?.roles?.permissions?.includes('room:share' as never) ?? false

  let rooms: DbRoom[] = []
  let activeRooms: ActiveRoom[] = []

  try { rooms = await fetchUserDbRooms(searchParams) } catch {} // prettier-ignore
  try { activeRooms = await fetchActiveRooms() } catch {} // prettier-ignore

  // @TODO: SSE CLIENT

  return (
    <PageContainer
      icon='room'
      title='Beranda'
      subTitle='Bergabung dalam ruangan secara instan'
      backToTopButton
      insertAfterTitle={<JoinRoom rooms={rooms} />}
    >
      <RoomListHeader />
      <RoomList
        staticRooms={rooms}
        activeRooms={activeRooms}
        isAdmin={isAdmin}
        canShareLink={hasPermission}
      />
    </PageContainer>
  )
}
