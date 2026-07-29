import type { ResponseNext } from '@/feat/types'
import { djs } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { fetchGroups, fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { RoomListClient } from '@/app/(protected)/rooms/client'

async function getRoomListConfig(searchParams: object) {
  const session = await auth()
  const initialRooms = await fetchUserDbRooms(searchParams)
  const isAdmin = session?.roles.name === 'admin'

  const hasPermission = (key: string) => {
    return !!session?.roles?.permissions?.some((perm) => perm.key.endsWith(key))
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

  const groups = isAdmin ? await fetchGroups() : []

  return (
    <PageContainer
      icon='room'
      title='Daftar Ruangan'
      subTitle='Kelola ruangan rapat untuk setiap kebutuhan rapat'
      backToTopButton
    >
      <RoomListClient
        rooms={rooms}
        groups={groups}
        isAdmin={isAdmin}
        isEmpty={isEmpty}
        isInvalid={isInvalid}
        canShareLink={hasPermission('room:share')}
        canCreate={hasPermission('room:manage')}
      />
    </PageContainer>
  )
}
