import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { fetchRoomByCode } from '@/lib/api/admin-api'
import { isVideoCodec } from '@/feat/helpers'
import { fetcher } from '@/feat/Auth/helpers'
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

  if (!session) {
    const { data } = await fetcher<{ callbackUrl: string }>(
      process.env.KEYCLOAK_REDIRECT_URI + '/api/verify' + '?room=' + params.name,
      {
        method: 'POST',
      }
    )

    return redirect(data.callbackUrl)
  }

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
    />
  )
}
