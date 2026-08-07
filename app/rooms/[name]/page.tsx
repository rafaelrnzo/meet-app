import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { fetchRoomByCode } from '@/lib/api/admin-api'
import { isVideoCodec } from '@/feat/helpers'
import { RoomsDetail } from '@/app/rooms/[name]/client'

interface RoomsDetailPageProps {
  params: Promise<{ name: string }>
  searchParams: Promise<{
    region?: string
    hq?: string
    codec?: string
    singlePC?: string
  }>
}

export default async function RoomsDetailPage(props: RoomsDetailPageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const session = await auth()
  const isAdmin = session?.profile.role.name === 'admin'
  let room

  if (!session) return

  try {
    // Validate room
    room = await fetchRoomByCode(params.name)
  } catch {
    return notFound()
  }

  return (
    <RoomsDetail
      metadata={room.metadata}
      roomName={params.name}
      region={searchParams.region}
      hq={searchParams.hq === 'true'}
      codec={isVideoCodec(searchParams.codec) ? searchParams.codec : 'vp9'}
      singlePeerConnection={searchParams.singlePC !== 'false'}
      isTesting={!!process.env.LIVEKIT_API_INTERCEPTOR}
      withPassword={!!room.password && !isAdmin}
      roomTitle={room.name}
    />
  )
}
