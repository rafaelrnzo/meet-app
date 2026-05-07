'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRoomContext, useLocalParticipant } from '@livekit/components-react'
import { RoomEvent, DataPacket_Kind, RemoteParticipant } from 'livekit-client'

const RPlayer = dynamic(() => import('react-player'), { ssr: false })
import ReactPlayer from 'react-player/lazy'
import { toast } from 'sonner'
import { X, ExternalLink, Play, Pause, RefreshCw, AlertCircle } from 'lucide-react'
import { updateRoomPermissions } from '@/lib/api/admin-api'

interface YouTubeSyncWrapperProps {
  roomName: string
  isAdmin: boolean
  onClose: () => void
  initialUrl: string
}

interface YTState {
  url: string
  playing: boolean
  time: number
  lastUpdate: number
}

export function YouTubeSyncWrapper({
  roomName,
  isAdmin,
  onClose,
  initialUrl,
}: YouTubeSyncWrapperProps) {
  const room = useRoomContext()
  const playerRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  const [playing, setPlaying] = useState(isAdmin)
  const [url, setUrl] = useState(initialUrl)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl)
      setError(null)
      setIsReady(false)
    }
  }, [initialUrl])

  const lastSentUpdate = useRef<number>(0)
  const isSeeking = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!room) return

    const checkMetadata = () => {
      try {
        const md = room.metadata ? JSON.parse(room.metadata) : {}
        if (md.youtube) {
          if (md.youtube.url && md.youtube.url !== url) {
            setUrl(md.youtube.url)
            setError(null)
            setIsReady(false)
          }

          if (typeof md.youtube.playing === 'boolean' && md.youtube.playing !== playing) {
            setPlaying(md.youtube.playing)
          }

          if (md.youtube.time !== undefined && playerRef.current && isReady && !isSeeking.current) {
            const currentTime = playerRef.current.getCurrentTime()
            const serverTime = md.youtube.time
            if (Math.abs(currentTime - serverTime) > 5) {
              playerRef.current.seekTo(serverTime, 'seconds')
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse YouTube metadata', e)
      }
    }

    room.on(RoomEvent.RoomMetadataChanged, checkMetadata)
    checkMetadata()

    return () => {
      room.off(RoomEvent.RoomMetadataChanged, checkMetadata)
    }
  }, [room, url, playing, isReady])

  useEffect(() => {
    if (!room) return

    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind
    ) => {
      try {
        const str = new TextDecoder().decode(payload)
        const data = JSON.parse(str)

        if (data.topic === 'YT_SYNC') {
          if (data.action === 'play') {
            setPlaying(true)
          } else if (data.action === 'pause') {
            setPlaying(false)
          } else if (data.action === 'seek') {
            if (playerRef.current && isReady) {
              playerRef.current.seekTo(data.time)
            }
          } else if (data.action === 'sync') {
            if (playerRef.current && isReady) {
              const currentTime = playerRef.current.getCurrentTime()
              if (Math.abs(currentTime - data.time) > 2) {
                playerRef.current.seekTo(data.time)
              }
            }
          }
        }
      } catch (e) {}
    }

    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  const broadcastAction = useCallback(
    (action: string, time?: number) => {
      if (!room || !isAdmin) return

      const payload = JSON.stringify({
        topic: 'YT_SYNC',
        action,
        time,
      })

      const data = new TextEncoder().encode(payload)

      room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'YT_SYNC',
      })

      if (action === 'play' || action === 'pause') {
        updateMetadata(action === 'play', time || 0)
      }
    },
    [room, isAdmin]
  )

  const updateMetadata = async (isPlaying: boolean, time: number) => {
    if (!room || !isAdmin) return
    try {
      const currentMd = room.metadata ? JSON.parse(room.metadata) : {}
      const newMd = {
        ...currentMd,
        youtube: {
          ...currentMd.youtube,
          playing: isPlaying,
          time: time,
          lastUpdate: Date.now(),
        },
      }

      await updateRoomPermissions(roomName, newMd)
    } catch (e) {
      console.error('Failed to update YT metadata', e)
    }
  }

  const handlePlay = () => {
    if (!isAdmin) return
    setPlaying(true)
    broadcastAction('play', playerRef.current?.getCurrentTime() || 0)
  }

  const handlePause = () => {
    if (!isAdmin) return
    setPlaying(false)
    broadcastAction('pause', playerRef.current?.getCurrentTime() || 0)
  }

  const handleSeek = (seconds: number) => {
    if (!isAdmin) return
    isSeeking.current = true
  }

  const handleReady = () => {
    setIsReady(true)

    if (room && room.metadata) {
      try {
        const md = JSON.parse(room.metadata)
        if (md.youtube && md.youtube.time && playerRef.current) {
          playerRef.current.seekTo(md.youtube.time, 'seconds')
        }
      } catch (e) {}
    }
  }

  const handleError = (e: any) => {
    console.error('YouTube Player Error:', e)
    setError('Failed to load video. Please check the URL.')
    toast.error('YouTube Player Error: Video failed to load.')
  }

  const handleForceSync = () => {
    if (!playerRef.current || !isAdmin) return
    const t = playerRef.current.getCurrentTime()
    broadcastAction('sync', t)
    updateMetadata(playing, t)
    toast.success('Forced sync sent to all viewers')
  }

  useEffect(() => {
    if (!isAdmin || !playing) return

    const interval = setInterval(() => {
      if (playerRef.current && isReady) {
        const t = playerRef.current.getCurrentTime()
        broadcastAction('sync', t)

        if (Date.now() - lastSentUpdate.current > 10000) {
          updateMetadata(playing, t)
          lastSentUpdate.current = Date.now()
        }
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [isAdmin, playing, broadcastAction])

  if (!mounted) return null

  return (
    <div className='animate-in fade-in zoom-in relative flex h-full w-full flex-col bg-black duration-300'>
      {/* Header / Controls Overlay */}
      <div className='pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4'>
        <div className='pointer-events-auto flex items-center gap-2'>
          <div className='flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white'>
            <ExternalLink size={12} />
            YouTube Sharing
          </div>
          {!isAdmin && (
            <span className='rounded bg-black/50 px-2 py-1 text-xs text-white/70'>
              Syncing with host...
            </span>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={onClose}
            className='pointer-events-auto rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20'
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className='animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 p-6 text-center'>
          <div className='bg-destructive/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <AlertCircle className='text-destructive h-6 w-6' />
          </div>
          <h3 className='mb-2 font-semibold text-white'>Video Unavailable</h3>
          <p className='max-w-md text-sm text-white/70'>{error}</p>
          {isAdmin && (
            <button
              onClick={onClose}
              className='mt-6 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20'
            >
              Close Player
            </button>
          )}
        </div>
      )}

      {/* Admin Controls Overlay (Bottom) */}
      {isAdmin && isReady && !error && (
        <div className='pointer-events-none absolute right-0 bottom-8 left-0 z-20 flex justify-center'>
          <div className='pointer-events-auto top-full flex transform items-center gap-4 rounded-full border border-white/10 bg-black/60 px-4 py-2 shadow-xl backdrop-blur transition-transform hover:scale-105'>
            <button
              onClick={handleForceSync}
              className='flex items-center gap-2 text-xs font-medium text-white/80 transition-colors hover:text-white'
              title='Force Sync All Users'
            >
              <RefreshCw size={14} />
              Force Sync
            </button>
          </div>
        </div>
      )}

      {/* Helper message for Admin */}
      {isAdmin && !playing && (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center'>
          <div className='flex animate-pulse flex-col items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm'>
            <Play className='h-8 w-8 fill-white text-white' />
            <p className='text-sm font-medium text-white'>You are controlling playback</p>
          </div>
        </div>
      )}

      <div className='pointer-events-auto relative h-full w-full flex-1'>
        {url && ReactPlayer.canPlay(url) ? (
          <RPlayer
            ref={playerRef}
            url={url}
            playing={playing}
            width='100%'
            height='100%'
            controls={isAdmin}
            volume={volume}
            muted={muted}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={(s: number) => {
              if (isAdmin) {
                broadcastAction('seek', s)
                isSeeking.current = false
              }
            }}
            onProgress={(state) => {}}
            onReady={handleReady}
            onError={handleError}
            style={{ pointerEvents: isAdmin ? 'auto' : 'none' }}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-black'>
            <p className='text-sm text-white/50'>Waiting for valid video URL...</p>
          </div>
        )}

        {!isAdmin && <div className='absolute inset-0 z-10 bg-transparent' />}
      </div>
    </div>
  )
}
