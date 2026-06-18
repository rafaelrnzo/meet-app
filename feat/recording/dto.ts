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
  StatusUpdate = 'recording_status_updated',
  Delete = 'recording_deleted',
}

interface RecordingStatusUpdatedDTO {
  type: RecordingEvent.StatusUpdate
  data: RecordingData & {
    status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED'
  }
}

interface RecordingDeletedDTO {
  type: RecordingEvent.Delete
  data: RecordingData & {
    status: 'DELETED'
  }
}

type RecordingSSEDTO = RecordingStatusUpdatedDTO | RecordingDeletedDTO

export type { RecordingSSEDTO }
export { RecordingEvent }
