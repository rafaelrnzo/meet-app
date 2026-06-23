'use server'

import { createAuthHeaders, fetcher } from '@/feat/Auth/helpers'
import { ConnectionInterceptor } from '@/feat/enum'
import { auth } from '@/lib/auth'
import { createResponseError } from '@/lib/utils'

interface PrejoinPayload {
  roomName: string
  participantName: string
  password?: string
  region?: string
}

export async function prejoinVerify(payload: PrejoinPayload) {
  //
  try {
    const session = await auth()
    if (!session) {
      return { data: null, interceptor: ConnectionInterceptor.Unauthorized }
    }
    const url = process.env.APP_API_VIDEO_CONFERENCE ?? '' + '/api/livekit/token'
    // const sdsda = await fetcher(url, {
    //   headers: createAuthHeaders(session.access_token),
    //   body: JSON.stringify({ room_code: payload.roomName }),
    // })
    console.log(session.access_token)
    return { data: null, interceptor: ConnectionInterceptor.Unknown }
  } catch (e) {
    return { data: null, interceptor: ConnectionInterceptor.Unknown }
  }
}
