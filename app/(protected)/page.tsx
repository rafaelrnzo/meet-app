import type { ActiveRoom, DbRoom } from '@/lib/api/admin-api'
import { auth } from '@/lib/auth'
import { fetchActiveRooms, fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { RoomList } from '@/components/features/rooms/RoomList'

export default async function HomePage() {
  const session = await auth()
  const isAdmin = session?.roles.name === 'admin'
  const hasPermission = session?.roles?.permissions?.includes('room:share' as never) ?? false

  let rooms: DbRoom[] = []
  let activeRooms: ActiveRoom[] = []

  try { rooms = await fetchUserDbRooms() } catch {} // prettier-ignore
  try { activeRooms = await fetchActiveRooms() } catch {} // prettier-ignore

  // @TODO: SSE CLIENT

  return (
    <PageContainer
      icon='room'
      title='Beranda'
      subTitle='Bergabung dalam ruangan secara instan'
      backToTopButton
    >
      <RoomList
        staticRooms={rooms}
        activeRooms={activeRooms}
        isAdmin={isAdmin}
        canShareLink={hasPermission}
      />
    </PageContainer>
  )
}
