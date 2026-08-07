import type { ResponseNext } from '@/feat/types'
import { notFound } from 'next/navigation'
import { default as path } from 'path'
import { createResponseError, createResponseSuccess } from '@/lib/utils'
import { fetchRecordings, fetchRecordingVideo } from '@/lib/api/admin-api'
import { default as RecordingClient } from '@/app/(protected)/recordings/[code]/[id]/download/client'

async function fetchVideo({ code, id }: { code: string; id: number }) {
  try {
    const [recording, blob] = await Promise.all([
      fetchRecordings({ room_id: code }),
      fetchRecordingVideo(id),
    ])
    const filename = recording.find((rec) => rec.id === id)?.name ?? 'Recording'
    return createResponseSuccess({ filename, blob })
  } catch (error) {
    return createResponseError<{ filename: string; blob: Blob }>(error)
  }
}

async function DetailRecording(props: ResponseNext<{ code: string; id: string }>) {
  const { code, id } = await props.params
  const response = await fetchVideo({ code, id: Number(id) })

  if (response.error) {
    return notFound()
  }

  const { blob, filename } = response.data
  const formatted = `${path.basename(filename, path.extname(filename))}.mp4`

  return <RecordingClient {...{ blob, filename: formatted }} />
}

export default DetailRecording
