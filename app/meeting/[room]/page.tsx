import { Suspense } from 'react'
import MeetingClient from '@/components/features/meeting/MeetingClient'
import { Loader } from '@/components/livekit/layout/Loader'

/**
 * Server component that handles the meeting room route.
 * Validates the room parameter and renders the meeting client within a suspense boundary.
 *
 * @param {Object} props - The component properties.
 * @param {Promise<{ room: string }>} props.params - The route parameters containing the room ID.
 * @param {Promise<{ identity?: string }>} props.searchParams - The URL search parameters containing an optional user identity.
 * @returns {JSX.Element} The rendered meeting page or an error message if the room parameter is missing.
 */
export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ room: string }>
  searchParams: Promise<{ identity?: string }>
}) {
  const { room } = await params

  if (!room || !room.trim()) {
    return (
      <div style={{ padding: 24, color: '#eee', background: '#111', height: '100vh' }}>
        <h3>Room parameter is empty.</h3>
        <p>
          Please open a URL like: <code>/meeting/default-room?identity=name</code>
        </p>
        <p>
          Example: <code>/meeting/default-room?identity=test</code>
        </p>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loader text='Preparing meeting...' />}>
      <MeetingClient room={room} />
    </Suspense>
  )
}
