import type { FC } from 'react'
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client'

export interface SessionProps {
  roomName: string
  identity: string
  audioTrack?: LocalAudioTrack
  videoTrack?: LocalVideoTrack
  region?: string
  turnServer?: RTCIceServer
  forceRelay?: boolean
}

export interface TokenResult {
  identity: string
  accessToken: string
}

export interface ConnectionDetails {
  serverUrl: string
  roomName: string
  participantName: string
  participantToken: string
}

export interface ParticipantStatus {
  isSpeaking: boolean
  isRecording: boolean
  isWhiteboard: boolean
  isPresentation: boolean
  isWatchYoutube: boolean
  isHandRaised: boolean
}

export interface TabProps {
  id: number
  content: () => FC
  hide: boolean
  parentId?: number
  description?: string
}

export interface ResponseNext<P = object, S = object> {
  params: Promise<P>
  searchParams: Promise<S>
}

export type RoleName = 'admin' | 'moderator' | 'user'
