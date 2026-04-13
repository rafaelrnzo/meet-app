'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Track,
  type Participant,
  type RemoteTrackPublication,
  type LocalTrackPublication,
  type RemoteAudioTrack,
  type RemoteVideoTrack,
  TrackEvent,
} from 'livekit-client'
import type { GridItem } from './useTracksLite'
import { useRoomContext } from '@livekit/components-react'

type Pub = RemoteTrackPublication | LocalTrackPublication

function isRemotePublication(pub: Pub): pub is RemoteTrackPublication {
  return typeof (pub as any).setSubscribed === 'function'
}

function attachVideo(pub: Pub | undefined, el: HTMLVideoElement | null) {
  if (!pub || !el) return

  // Remote video
  const remoteVid = (pub as RemoteTrackPublication).videoTrack as
    | RemoteVideoTrack
    | null
    | undefined
  if (remoteVid) {
    remoteVid.attach(el)
    return
  }

  // Local video
  const localVid = (pub as LocalTrackPublication).videoTrack
  if (localVid) {
    localVid.attach(el)
  }
}

function detachVideo(pub: Pub | undefined, el: HTMLVideoElement | null) {
  if (!pub || !el) return

  const remoteVid = (pub as RemoteTrackPublication).videoTrack as
    | RemoteVideoTrack
    | null
    | undefined
  if (remoteVid) {
    remoteVid.detach(el)
    return
  }

  const localVid = (pub as LocalTrackPublication).videoTrack
  if (localVid) {
    localVid.detach(el)
  }
}

function getMicPublication(p: Participant) {
  return p.getTrackPublication(Track.Source.Microphone)
}

export default function CustomTile({ item }: { item: GridItem }) {
  const room = useRoomContext()
  const { participant, videoPub, kind, hasAudio } = item

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [subscribed, setSubscribed] = useState<boolean>(!!videoPub?.isSubscribed)

  // ---------- VIDEO subscribe & attach ----------
  useEffect(() => {
    if (!videoPub) return
    let cancelled = false

    const ensureSubAndAttach = () => {
      try {
        if (isRemotePublication(videoPub) && !videoPub.isSubscribed) {
          videoPub.setSubscribed(true)
        }
        if (!cancelled) setSubscribed(true)
        attachVideo(videoPub, videoRef.current)
      } catch (e) {
        console.error('[Tile] subscribe video error:', e)
      }
    }

    ensureSubAndAttach()

    const handleSubscribed = () => {
      detachVideo(videoPub, videoRef.current)
      attachVideo(videoPub, videoRef.current)
      setSubscribed(true)
    }
    const handleUnsubscribed = () => {
      detachVideo(videoPub, videoRef.current)
      setSubscribed(false)
    }

    ;(videoPub as any).on?.(TrackEvent.Subscribed, handleSubscribed)
    ;(videoPub as any).on?.(TrackEvent.Unsubscribed, handleUnsubscribed)

    return () => {
      cancelled = true
      ;(videoPub as any).off?.(TrackEvent.Subscribed, handleSubscribed)
      ;(videoPub as any).off?.(TrackEvent.Unsubscribed, handleUnsubscribed)
      detachVideo(videoPub, videoRef.current)
    }
  }, [videoPub])

  useEffect(() => {
    if (!room) return
    if (participant.isLocal) return

    const micPub = getMicPublication(participant)
    if (!micPub || !hasAudio) return

    const attach = () => {
      const track = micPub.audioTrack as RemoteAudioTrack | null | undefined
      if (track && audioRef.current) {
        track.attach(audioRef.current)
        audioRef.current.muted = false
        audioRef.current.autoplay = true
        audioRef.current.volume = 1
        audioRef.current.play().catch(() => {})
      }
    }

    const detach = () => {
      const track = micPub.audioTrack as RemoteAudioTrack | null | undefined
      if (track && audioRef.current) {
        track.detach(audioRef.current)
      }
    }

    try {
      attach()
    } catch (e) {
      console.error('[Tile] subscribe audio error:', e)
    }

    const onSubChange = () => {
      detach()
      attach()
    }

    ;(micPub as any).on?.(TrackEvent.Subscribed, onSubChange)
    ;(micPub as any).on?.(TrackEvent.Unsubscribed, onSubChange)

    return () => {
      ;(micPub as any).off?.(TrackEvent.Subscribed, onSubChange)
      ;(micPub as any).off?.(TrackEvent.Unsubscribed, onSubChange)
      detach()
    }
  }, [room, participant, hasAudio])

  return (
    <div
      className='relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900'
      style={{ aspectRatio: kind === 'screen' ? '16 / 9' : '4 / 3' }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className='h-full w-full bg-black object-cover'
      />
      <audio ref={audioRef} className='hidden' />

      <div className='absolute right-2 bottom-2 left-2 flex items-center justify-between text-xs'>
        <div className='rounded border border-white/10 bg-black/60 px-2 py-1 backdrop-blur'>
          {participant.identity} {kind === 'screen' ? '• screen' : ''}
        </div>
        {!subscribed && <div className='rounded bg-yellow-600/80 px-2 py-1'>subscribing…</div>}
      </div>
    </div>
  )
}
