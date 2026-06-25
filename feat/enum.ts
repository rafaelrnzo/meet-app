export enum MessageType {
  Update = 0,
  StateVector = 1,
}

export enum LiveKitKey {
  YJSDoc = 'yjs-whiteboard',
  YJSAwareness = 'yjs-awareness',
  TLDrawRecord = 'tldraw-records',
}

export enum LiveKitAction {
  SnapshotRequest = 'SNAPSHOT_REQUEST',
  SnapshotReply = 'SNAPSHOT_REPLY',
  YoutubeUpdate = 'YOUTUBE_UPDATE',
  PresentationUpdate = 'PRESENTATION_UPDATE',
  HandRaisedUpper = 'HANDRAISED_UPPER',
  HandRaisedLower = 'HANDRAISED_LOWER',
  MicrophoneUpdate = 'MICROPHONE_UPDATE',
  PollingVoteNow = 'POLLING_VOTE_NOW',
  Reaction = 'REACTION',
}

export enum ParticipantAttribute {
  ScreenRecord = 'SCREEN_RECORD',
  ScreenActive = 'SCREEN_ACTIVE',
  ScreenActiveHost = 'SCREEN_ACTIVE_HOST',
  ScreenActiveUrl = 'SCREEN_ACTIVE_URL',
  ScreenActivePolling = 'SCREEN_ACTIVE_POLLING',
  HandRaised = 'HAND_RAISED',
}

export enum ConnectionInterceptor {
  Unknown = 'unknown',
  Blocked = 'blocked',
  Pending = 'pending',
  Limit = 'limit',
  Unauthorized = 'unauthorized',
}

export enum SearchParamsKey {
  TabsCode = 'tc',
  PanelCode = 'pc',
  ScreenCode = 'sc',
}

export enum PanelCode {
  Open = 1,
  SideOpen = 2,
}

export enum ScreenCode {
  Recording = 1,
  Whiteboard = 2,
  Presentation = 3,
  WatchYoutube = 4,
  Notes = 5,
  Polling = 6,
}

export enum TabsCode {
  TabsMeeting = 1,
  TabsMeetingNotes = 11,
  TabsMeetingPolling = 12,
  TabsMeetingWatchYoutube = 13,
  TabsParticipant = 2,
  TabsChats = 3,
  TabsPersonalize = 4,
  TabsSettings = 5,
}

export enum GroupsCode {
  Collaboration = 1,
  Content = 2,
  Media = 3,
  Admin = 4,
}

export enum GroupCode {
  Notes = 1,
  Polling = 2,
  Whiteboard = 3,
  Presentation = 4,
  WatchYoutube = 5,
  Recording = 6,
  PickRandom = 7,
}
