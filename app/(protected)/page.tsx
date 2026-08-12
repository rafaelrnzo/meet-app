import type { DbRoom } from '@/lib/api/admin-api'
import type { ResponseNext } from '@/feat/types'
import { djs } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { JoinRoom } from '@/components/JoinRoom'
import { HomeClient } from '@/app/(protected)/home-client'

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
      <HomeClient
        rooms={rooms}
        isAdmin={isAdmin}
        isEmpty={isEmpty}
        isInvalid={isInvalid}
        canShareLink={hasPermission('room:share')}
      />
    </PageContainer>
  )
}
