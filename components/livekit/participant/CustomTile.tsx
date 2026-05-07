'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Participant, RemoteTrackPublication, LocalTrackPublication } from 'livekit-client'
import { Track } from 'livekit-client'

type TrackRefLite = {
  participant: Participant
  source?: Track.Source
  publication?: RemoteTrackPublication | LocalTrackPublication | null
}

type Props = {
  trackRef?: TrackRefLite
  participant?: Participant
  secondaryLabel?: string
  className?: string
}

export default function CustomTile({
  trackRef,
  participant: pAlt,
  secondaryLabel,
  className,
}: Props) {
  const videoEl = useRef<HTMLVideoElement | null>(null)

  const participant = trackRef?.participant ?? pAlt
  const pub = trackRef?.publication ?? null

  const isVideoLike = useMemo(() => {
    if (!trackRef) return false
    if (trackRef.source === Track.Source.ScreenShare) return true
    if (trackRef.source === Track.Source.Camera) return true
    return pub?.kind === 'video'
  }, [trackRef, pub])

  useEffect(() => {
    const v = videoEl.current
    const lkTrack: any = pub?.track || null
    if (!v || !lkTrack || !isVideoLike) return

    try {
      lkTrack.attach(v)
    } catch (e) {
      console.warn('[CustomTile] attach video error:', e)
    }
    return () => {
      try {
        lkTrack.detach(v)
      } catch {}
    }
  }, [pub?.track, isVideoLike])

  if (!participant) {
    return (
      <div className={`rounded border border-neutral-800 bg-neutral-900/60 p-4 ${className ?? ''}`}>
        <div className='text-sm text-neutral-400'>menunggu…</div>
      </div>
    )
  }

  const micPub = participant.getTrackPublication(Track.Source.Microphone) as
    | RemoteTrackPublication
    | LocalTrackPublication
    | undefined
  const micMuted = micPub?.isMuted ?? true

  const displayName = participant.name || participant.identity

  if (isVideoLike && pub?.isSubscribed !== false) {
    const isScreen = trackRef?.source === Track.Source.ScreenShare

    return (
      <div className={`relative overflow-hidden rounded bg-black ${className ?? ''}`}>
        <video
          ref={videoEl}
          autoPlay
          playsInline
          muted={participant.isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div className='absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs text-white'>
          {!isScreen && (
            <span
              className={`inline-block h-2 w-2 rounded-full ${micMuted ? 'bg-red-500' : 'bg-green-400'}`}
              title={micMuted ? 'mic muted' : 'mic on'}
            />
          )}
          <span className='font-medium'>{displayName}</span>
          {isScreen && <span className='opacity-80'>screen</span>}
          {secondaryLabel && <span className='opacity-80'>{secondaryLabel}</span>}
        </div>
      </div>
    )
  }

  const initial = (participant.name?.[0] || participant.identity?.[0] || '?').toUpperCase()

  return (
    <div
      className={`flex items-center justify-center rounded border border-neutral-800 bg-neutral-900/60 p-4 ${className ?? ''}`}
      style={{ minHeight: 180 }}
    >
      <div className='text-center'>
        <div
          className='mx-auto mb-3 grid place-items-center rounded-full bg-neutral-800 text-white'
          style={{ width: 64, height: 64, fontWeight: 700, fontSize: 20 }}
        >
          {initial}
        </div>
        <div className='text-sm font-medium text-neutral-200'>{displayName}</div>
        <div className='mt-1 flex items-center justify-center gap-2 text-xs text-neutral-500'>
          <span
            className={`inline-block h-2 w-2 rounded-full ${micMuted ? 'bg-red-500' : 'bg-green-400'}`}
            title={micMuted ? 'mic muted' : 'mic on'}
          />
          <span>kamera mati</span>
        </div>
      </div>
    </div>
  )
}
