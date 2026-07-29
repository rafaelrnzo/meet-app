/* eslint-disable no-undef */
import { useEffect, useRef, useEffectEvent } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'
import { decoder, encoder } from '@/lib/utils'
import { useRoomState } from '@/feat/Room'
import { parseYoutubeURL } from '@/feat/helpers'
import { LiveKitAction } from '@/feat/enum'

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface YoutubeMessage {
  action: LiveKitAction.YoutubeUpdate
  payload: {
    videoId: string
    currentTime: number
    isPlaying: boolean
    timestamp: number
    quality: YT.SuggestedVideoQuality
    isMuted: boolean
    volume: number
    playbackRate: number
  }
}

export function useYoutubeSync(onReady?: () => void) {
  const { screen } = useRoomState()
  const room = useRoomContext()
  const videoUrl = screen?.url ?? ''
  const hasControl = room.localParticipant.identity === screen?.host
  const playerRef = useRef<YT.Player | null>(null)
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const isRemoteApplyingRef = useRef(false)
  const syncIntervalRef = useRef<number | null>(null)
  const videoIdRef = useRef(parseYoutubeURL(videoUrl).youtubeVideoID)
  const isPlayerReadyRef = useRef(false)
  const pendingPayloadRef = useRef<YoutubeMessage['payload'] | null>(null)
  const playbackQualityRef = useRef<YT.SuggestedVideoQuality>('medium')

  // Host: broadcast state to all participants via rAF, throttled to every 200ms
  const startBroadcast = useEffectEvent((current: typeof room) => {
    let lastTime = 0

    const loop = (now: number) => {
      if (!syncIntervalRef.current) return

      // Only broadcast every 200ms — no need to send every frame
      if (now - lastTime > 200) {
        if (playerRef.current) {
          const quality = playerRef.current?.getPlaybackQuality()

          if (quality && quality !== playbackQualityRef.current) {
            playbackQualityRef.current = quality
          }

          const message: YoutubeMessage = {
            action: LiveKitAction.YoutubeUpdate,
            payload: {
              videoId: videoIdRef.current,
              currentTime: playerRef.current.getCurrentTime(),
              isPlaying: playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING,
              timestamp: Date.now(), // Wall clock at time of broadcast
              quality: playerRef.current.getPlaybackQuality(),
              isMuted: playerRef.current?.isMuted() ?? false,
              volume: playerRef.current.getVolume() ?? 100,
              playbackRate: playerRef.current?.getPlaybackRate(),
            },
          }
          current.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
            reliable: false,
          })
          lastTime = now
        }
      }
      syncIntervalRef.current = requestAnimationFrame(loop)
    }

    syncIntervalRef.current = requestAnimationFrame(loop)
  })

  // Fix 1: was clearInterval — must use cancelAnimationFrame since syncIntervalRef holds a rAF ID
  const stopBroadcast = () => {
    if (!syncIntervalRef.current) return
    cancelAnimationFrame(syncIntervalRef.current)
    syncIntervalRef.current = null
  }

  // Participant: receive and apply sync from host
  const handleDataReceived = useEffectEvent((payload: Uint8Array) => {
    const rawString = decoder.decode(payload)

    // Invalid json parse
    if (!rawString.trim().startsWith('{')) {
      return
    }

    try {
      const message = JSON.parse(decoder.decode(payload)) as YoutubeMessage
      if (message.action !== LiveKitAction.YoutubeUpdate || hasControl) return

      // Player not ready yet — buffer the latest payload
      if (!playerRef.current || !isPlayerReadyRef.current) {
        pendingPayloadRef.current = message.payload
        return
      }

      const player = playerRef.current
      const { videoId, currentTime, isPlaying, timestamp, quality, isMuted, volume, playbackRate } =
        message.payload

      const isLocalMuted = player.isMuted()

      if (isMuted && !isLocalMuted) {
        player.mute()
      } else if (!isMuted && isLocalMuted) {
        player.unMute()
      }

      //forced participant to sync with host up and down volume
      const currentLocalVolume = player.getVolume()
      if (volume !== currentLocalVolume) {
        player.setVolume(volume)
      }

      //forced participant to sync with host speed of video
      const currentRate = player.getPlaybackRate()
      if (playbackRate && playbackRate !== currentRate) {
        player.setPlaybackRate(playbackRate)
      }

      // --- LATENCY COMPENSATION ---
      // Estimate how long the data was in transit
      const networkLatency = (Date.now() - timestamp) / 1000
      const adjustedTime = currentTime + networkLatency + 0.1 // +0.1s extra buffer

      // Switch video if ID changed
      if (videoId !== videoIdRef.current) {
        videoIdRef.current = videoId
        player.loadVideoById({ videoId, startSeconds: adjustedTime, suggestedQuality: quality })
        return
      }

      const playerState = player.getPlayerState()

      // Fix 2: Don't seek while buffering — calling seekTo during BUFFERING restarts
      // the buffer, causing an infinite loading loop on the participant side
      const isBuffering = playerState === window.YT.PlayerState.BUFFERING

      // Force quality during active playback by seeking to current position
      const currentQuality = player.getPlaybackQuality()
      if (quality && quality !== currentQuality) {
        player.setPlaybackQuality(quality)
        // seekTo forces YouTube to re-buffer at the new quality level
        if (!isBuffering) {
          player.seekTo(player.getCurrentTime(), true)
        }
      }

      // Resync if drift exceeds 300ms tolerance and player isn't mid-buffer
      const drift = Math.abs(player.getCurrentTime() - adjustedTime)
      if (drift > 0.3 && !isBuffering) {
        player.seekTo(adjustedTime, true)
      }

      // Fix 3: Only call playVideo/pauseVideo when state actually needs to change.
      // Calling playVideo() every 200ms while buffering was hammering the player
      // and restarting the buffer on every packet — the main cause of stuttering.
      const currentlyPlaying = playerState === window.YT.PlayerState.PLAYING
      if (isPlaying && !currentlyPlaying && !isBuffering) {
        player.playVideo()
      } else if (!isPlaying && currentlyPlaying) {
        player.pauseVideo()
      }
    } catch (e) {
      console.log('Failed to sync from the host:', e)
    }
  })

  const initPlayer = useEffectEvent((current: typeof room) => {
    if (!iframeContainerRef.current) return

    playerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: videoIdRef.current,
      playerVars: {
        autoplay: 0,
        controls: hasControl ? 1 : 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3,
        showinfo: 0,
        cc_load_policy: 1,
        cc_lang_pref: 'en',
      },
      events: {
        onReady: () => {
          isPlayerReadyRef.current = true
          playerRef.current?.setPlaybackQuality('medium')

          onReady?.()

          const pending = pendingPayloadRef.current

          // Apply buffered payload if it arrived before the player was ready
          if (pending) {
            pendingPayloadRef.current = null
            const { videoId, currentTime, isPlaying, timestamp, quality } = pending

            // Apply the same latency compensation as the live handler
            const networkLatency = (Date.now() - timestamp) / 1000
            const seekTime = currentTime + networkLatency

            // Use a one-time onStateChange listener instead of setTimeout
            const handlePendingState = (event: YT.OnStateChangeEvent) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                if (!isPlaying) {
                  playerRef.current?.pauseVideo()
                  playerRef.current?.removeEventListener('onStateChange', handlePendingState)
                }
              }
            }

            playerRef.current?.addEventListener('onStateChange', handlePendingState)
            playerRef.current?.loadVideoById({
              videoId,
              startSeconds: seekTime,
              suggestedQuality: quality,
            })
          }
        },
        onStateChange: (event) => {
          if (!hasControl) return
          if (isRemoteApplyingRef.current) return

          const now = Date.now()

          // Immediately broadcast on play/pause/seek
          const message: YoutubeMessage = {
            action: LiveKitAction.YoutubeUpdate,
            payload: {
              videoId: videoIdRef.current,
              currentTime: playerRef.current?.getCurrentTime() ?? 0,
              isPlaying: event.data === window.YT.PlayerState.PLAYING,
              timestamp: now,
              quality: playerRef.current?.getPlaybackQuality() ?? playbackQualityRef.current, // Fresh value,
              isMuted: playerRef.current?.isMuted() ?? false,
              volume: playerRef.current?.getVolume() ?? 100,
              playbackRate: playerRef.current?.getPlaybackRate() ?? 0,
            },
          }

          current.localParticipant.publishData(encoder.encode(JSON.stringify(message)), {
            reliable: true, // Reliable for important state-change events
          })

          // Start or stop the periodic broadcast loop
          if (event.data === window.YT.PlayerState.PLAYING) {
            startBroadcast(current)
          } else {
            stopBroadcast()
          }
        },
      },
    })
  })

  // Init YouTube IFrame API
  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer(room)
    } else {
      // Inject the API script if not already loaded
      const tag = document.createElement('script')

      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer.bind(null, room)
    }

    return () => {
      stopBroadcast()
      isPlayerReadyRef.current = false
      pendingPayloadRef.current = null
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [room])

  useEffect(() => {
    room.on(RoomEvent.DataReceived, handleDataReceived)
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived)
    }
  }, [room])

  return { videoUrl, videoIdRef, playerRef, hasControl, iframeContainerRef }
}

// const { startActiveScreen } = useRoomState()
// const { videoUrl, videoIdRef, playerRef, hasControl, iframeContainerRef } = useYoutubeSync({
//   onReady,
// })
//
// <InputHost
//   url={videoUrl}
//   onSave={async (newValue) => {
//     await startActiveScreen(ScreenCode.WatchYoutube, newValue)
//   }}
//   onEnter={(newValue) => {
//     const newVideoId = parseYoutubeURL(newValue)

//     videoIdRef.current = newVideoId
//     playerRef.current?.loadVideoById({ videoId: newVideoId })
//   }}
// />
