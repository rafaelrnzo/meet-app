import { isVideoCodec } from '@/feat/helpers'
import { RoomsDetail } from '@/app/rooms/[name]/client'
import { SessionProvider } from 'next-auth/react'

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
  const seachParams = await props.searchParams

  return (
    <SessionProvider>
      <RoomsDetail
        roomName={params.name}
        region={seachParams.region}
        hq={seachParams.hq === 'true'}
        codec={isVideoCodec(seachParams.codec) ? seachParams.codec : 'vp9'}
        singlePeerConnection={seachParams.singlePC !== 'false'}
        isTesting={!!process.env.LIVEKIT_API_INTERCEPTOR}
      />
    </SessionProvider>
  )
}
