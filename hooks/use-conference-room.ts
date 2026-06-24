import type { LayoutContextType } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { usePinnedTracks, useTracks } from '@livekit/components-react'
import { isEqualTrackRef } from '@livekit/components-core'

export function useConferenceRoom({ layoutContext }: { layoutContext: LayoutContextType }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveDeviceChanged], onlySubscribed: false }
  )

  const focusTrack = usePinnedTracks(layoutContext)?.[0]
  const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack))

  return { tracks, focusTrack, carouselTracks }
}
