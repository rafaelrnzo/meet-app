'use server'

import type { ConnectionDetails } from '@/feat/types'
import { auth } from '@/lib/auth'
import { ScreenCode, ConnectionInterceptor } from '@/feat/enum'
import { createAuthHeaders, fetcher } from '@/feat/Auth/helpers'

const DEFAULT_YOUTUBE_URL = 'https://youtu.be/e1QIqXmZ2os?si=Gd9591aZIBoeI3Mi'

const DEFAULT_FILE_URL = 'https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf'

interface PrejoinPayload {
  roomName: string
  participantName: string
  password?: string
  region?: string
}

interface BannedParticipantPayload {
  room_code: string
  identity: string
}

export async function prejoinVerify(payload: PrejoinPayload) {
  try {
    const session = await auth()
    if (!session) {
      return { data: null, interceptor: ConnectionInterceptor.Unauthorized }
    }
    const url = (process.env.APP_API_VIDEO_CONFERENCE ?? '') + '/api/join-rooms'
    const { data } = await fetcher(url, {
      method: 'POST',
      headers: createAuthHeaders(session.access_token),
      body: JSON.stringify({ room_code: payload.roomName }),
    })

    return data as { data: ConnectionDetails; interceptor: ConnectionInterceptor }
  } catch {
    return { data: null, interceptor: ConnectionInterceptor.Unknown }
  }
}

export async function acceptOrDeniedParticipant({
  action,
  ...payload
}: {
  roomName: string
  identity: string
  action: string
}) {
  try {
    const session = await auth()
    if (!session) {
      return { data: null, interceptor: ConnectionInterceptor.Unauthorized }
    }
    const url = (process.env.APP_API_VIDEO_CONFERENCE ?? '') + `/api/waiting-rooms/${action}`
    await fetcher(url, {
      method: 'POST',
      headers: createAuthHeaders(session.access_token),
      body: JSON.stringify({ room_code: payload.roomName, identity: payload.identity }),
    })

    return { data: { message: 'Success' }, interceptor: null }
  } catch {
    return { data: null, interceptor: ConnectionInterceptor.Unknown }
  }
}

export async function getRemoteUrl(
  screenId: Extract<ScreenCode, ScreenCode.WatchYoutube | ScreenCode.Presentation>
) {
  await new Promise((res) => setTimeout(res, 1000))

  const identifier = {
    [ScreenCode.WatchYoutube]: DEFAULT_YOUTUBE_URL,
    [ScreenCode.Presentation]: DEFAULT_FILE_URL,
  }

  try {
    return { data: { url: identifier[screenId] } }
  } catch (error) {
    return { data: null, error }
  }
}

export async function moderateParticipant(
  action: 'ban' | 'unban',
  payload: BannedParticipantPayload
) {
  try {
    const session = await auth()

    if (!session) {
      return {
        data: null,
        interceptor: ConnectionInterceptor.Unauthorized,
      }
    }

    const url = `${process.env.APP_API_VIDEO_CONFERENCE ?? ''}/api/livekit/${action}`

    const { data } = await fetcher(url, {
      method: 'POST',
      headers: createAuthHeaders(session.access_token),
      body: JSON.stringify(payload),
    })

    return data as { message: string }
  } catch {
    return {
      data: null,
      interceptor: ConnectionInterceptor.Unknown,
    }
  }
}
