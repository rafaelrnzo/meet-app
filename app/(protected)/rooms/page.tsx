import type { DbRoom } from '@/lib/api/admin-api'
import type { ResponseNext } from '@/feat/types'
import { notFound } from 'next/navigation'
import { djs } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { fetchGroups, fetchUserDbRooms } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { RoomListClient } from '@/app/(protected)/rooms/client'

async function getRoomListConfig(searchParams: object) {
  const session = await auth()
  let initialRooms: DbRoom[] = []
  const isAdmin = session?.roles.name === 'admin'

  const hasPermission = (key: string) => {
    return !!session?.roles?.permissions?.some((perm) => perm.key.endsWith(key))
  }

  if (session && hasPermission('module:rooms:access')) {
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

  if (!hasPermission('module:rooms:access')) return notFound()

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
