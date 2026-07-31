'use client'

import { useEffect, useRef } from 'react'
import { Track, LocalVideoTrack } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { useRoomState } from '@/feat/Room'

declare global {
  interface CropTarget {
    readonly __brand: 'CropTarget'
  }

  const CropTarget: {
    prototype: CropTarget
    fromElement: (element: Element) => Promise<CropTarget>
  }

  interface BrowserCaptureMediaStreamTrack extends MediaStreamTrack {
    cropTo(cropTarget: CropTarget | null): Promise<void>
  }
}

function supportsRegionCapture(track: MediaStreamTrack): track is BrowserCaptureMediaStreamTrack {
  return typeof CropTarget !== 'undefined' && 'cropTo' in track
}

async function captureActiveScreenRegion(containerEl: HTMLElement) {
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('getDisplayMedia tidak didukung di browser ini')
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: 'browser' },
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions)

  const track = stream.getVideoTracks()[0]

  if (supportsRegionCapture(track)) {
    const cropTarget = await CropTarget.fromElement(containerEl)
    await track.cropTo(cropTarget)
  }

  return stream
}

export function useActiveScreenPublish(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  const room = useRoomContext()
  const publishedTrackRef = useRef<LocalVideoTrack | null>(null)
  const rawStreamRef = useRef<MediaStream | null>(null)
  const { recordData, record } = useRoomState()

  const egressId = recordData?.egressId

  useEffect(() => {
    if (!active || !containerRef.current || !room || !record) {
      if (publishedTrackRef.current) {
        room?.localParticipant.unpublishTrack(publishedTrackRef.current)
        publishedTrackRef.current = null
      }
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((t) => t.stop())
        rawStreamRef.current = null
      }
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const stream = await captureActiveScreenRegion(containerRef.current!)

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        rawStreamRef.current = stream
        const videoTrack = stream.getVideoTracks()[0]
        const localTrack = new LocalVideoTrack(videoTrack)
        publishedTrackRef.current = localTrack

        videoTrack.addEventListener('ended', () => {
          if (publishedTrackRef.current) {
            room.localParticipant.unpublishTrack(publishedTrackRef.current)
            publishedTrackRef.current = null
          }
        })

        await room.localParticipant.publishTrack(localTrack, {
          name: 'shared-screen',
          source: Track.Source.ScreenShare,
          simulcast: false,
        })
      } catch (err) {
        console.error('Gagal publish active screen capture:', err)
      }
    })()

    return () => {
      cancelled = true
      if (publishedTrackRef.current) {
        room.localParticipant.unpublishTrack(publishedTrackRef.current)
        publishedTrackRef.current = null
      }
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((t) => t.stop())
        rawStreamRef.current = null
      }
    }
  }, [active, room, containerRef, egressId, record])
}
