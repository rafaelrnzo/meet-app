'use client'

import type { Recording } from '@/lib/api/admin-api'
import type { RecordingSSEDTO } from '@/feat/recording/dto'
import { useCallback, useEffect, useState } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { qstring } from '@/lib/utils'
import { fetchRecordings } from '@/lib/api/admin-api'
import { useEventSource } from '@/hooks/use-event-source'
import { useAuth } from '@/hooks/use-auth'
import { RecordingEvent } from '@/feat/recording/dto'

function useTabsSettingsRecording() {
  const room = useRoomContext()
  const { publicUrl, token } = useAuth()
  const [recordings, setRecordings] = useState<(Recording & { durationFormatted: string })[]>([])

  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')

    return `${hh}:${mm}:${ss}`
  }

  const getAllRecording = useCallback(async () => {
    try {
      const response = await fetchRecordings({ room_id: room.name })
      setRecordings(
        response.map((rec) => ({ ...rec, durationFormatted: formatSeconds(rec.duration_seconds) }))
      )
    } catch {
      setRecordings([])
    }
  }, [room.name])

  useEffect(() => {
    getAllRecording()
  }, [getAllRecording])

  useEventSource<RecordingSSEDTO>({
    eventUrl: qstring(`${publicUrl}/admin/recordings/events`, { token }),
    onMessage: (event) => {
      if (
        [
          RecordingEvent.Created,
          RecordingEvent.StatusUpdate,
          RecordingEvent.Rename,
          RecordingEvent.Delete,
        ].includes(event.type)
      ) {
        getAllRecording()
      }
    },
  })

  return {
    recordings,
  }
}

export { useTabsSettingsRecording }
