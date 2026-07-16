interface RecordingData {
  id: number
  room_id: string
  room_name: string
  name: string
  link: string
  egress_id: string
  updated_at: string // ISO 8601 datetime
}

enum RecordingEvent {
  Started = 'recording_started',
  Stopped = 'recording_stopped',
  Created = 'recording_created',
  StatusUpdate = 'recording_status_updated',
  Rename = 'recording_renamed',
  Delete = 'recording_deleted',
}

type RecordingSSEDTO =
  | {
      type: RecordingEvent.Started | RecordingEvent.Stopped
      data: { room_id: string; egress_id: string }
    }
  | {
      type: RecordingEvent.StatusUpdate | RecordingEvent.Rename
      data: RecordingData & {
        status: 'COMPLETED' | 'PROCESSING' | 'FAILED'
      }
    }
  | {
      type: RecordingEvent.Delete
      data: RecordingData & {
        status: 'DELETED'
      }
    }

export type { RecordingSSEDTO }
export { RecordingEvent }
