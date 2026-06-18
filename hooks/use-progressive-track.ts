import type { CreateLocalTracksOptions, LocalAudioTrack, LocalVideoTrack } from 'livekit-client'
import { useState, useEffect, useRef } from 'react'
import { Mutex, Track, createLocalTracks } from 'livekit-client'
import { log } from '@livekit/components-core'

export function useProgressiveTrack(
  options: CreateLocalTracksOptions,
  onError?: (err: Error, kind: Track.Kind.Audio | Track.Kind.Video) => void
) {
  const [tracks, setTracks] = useState<(LocalAudioTrack | LocalVideoTrack)[]>()
  const { audio, video } = options
  const trackLock = useRef(new Mutex())

  const handleTrackRef = useRef(
    <T extends Track.Kind.Audio | Track.Kind.Video>(
      type: T,
      config: T extends Track.Kind.Video ? typeof video : typeof audio,
      errorFn?: (e: Error, kind: Track.Kind.Audio | Track.Kind.Video) => void
    ) => {
      let needsCleanup = false
      let localTracks: (LocalAudioTrack | LocalVideoTrack)[] = []

      trackLock.current.lock().then(async (unlock) => {
        try {
          if (config) {
            localTracks = (await createLocalTracks({ [type]: config })) as never

            if (needsCleanup) {
              localTracks.forEach((tr) => tr.stop())
            } else {
              setTracks((prev) =>
                !prev
                  ? localTracks
                  : [...prev.filter((track) => track.kind !== type), ...localTracks]
              )
            }
          }
        } catch (e) {
          if (errorFn && e instanceof Error) {
            errorFn(e, type)
          } else {
            log.error(e)
          }
        } finally {
          unlock()
        }
      })

      return () => {
        needsCleanup = true
        localTracks.forEach((track) => {
          track.stop()
        })
      }
    }
  )

  useEffect(() => handleTrackRef.current(Track.Kind.Video, video, onError), [onError, video])
  useEffect(() => handleTrackRef.current(Track.Kind.Audio, audio, onError), [onError, audio])

  return tracks
}
