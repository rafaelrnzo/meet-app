import type { ResponseNext } from '@/feat/types'
import { fetchGroups, getRoomListConfig } from '@/lib/api/admin-api'
import { default as PageContainer } from '@/compounds/page-container'
import { RoomListClient } from '@/app/(protected)/rooms/client'

export default async function HomePage(props: ResponseNext) {
  const { isAdmin, isEmpty, rooms, hasPermission } = await getRoomListConfig(
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
        canShareLink={hasPermission('room:share')}
        canCreate={hasPermission('room:manage')}
      />
    </PageContainer>
  )
}
