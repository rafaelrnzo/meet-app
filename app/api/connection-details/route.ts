'use server'

import type { NextRequest } from 'next/server'
import type { AccessTokenOptions, VideoGrant } from 'livekit-server-sdk'
import type { ConnectionDetails } from '@/feat/types'
import { NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { randomString } from '@/lib/utils'
import { getLiveKitURL } from '@/feat/helpers'
import { ConnectionInterceptor } from '@/feat/enum'

const API_KEY = process.env.LIVEKIT_API_KEY
const API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_URL = process.env.LIVEKIT_URL

const COOKIE_KEY = 'random-participant-postfix'

const svc = new RoomServiceClient(
  process.env.LIVEKIT_URL ?? '',
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
)

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName')
    const participantName = request.nextUrl.searchParams.get('participantName')
    const metadata = request.nextUrl.searchParams.get('metadata') ?? ''
    const region = request.nextUrl.searchParams.get('region')
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined')
    }
    const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL
    const randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value ?? randomString(4)
    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region')
    }

    if (typeof roomName !== 'string') {
      return new NextResponse('Missing required query parameter: roomName', {
        status: 400,
      })
    }
    if (participantName === null) {
      return new NextResponse('Missing required query parameter: participantName', { status: 400 })
    }

    const participantToken = await createParticipantToken(
      {
        identity: `${participantName}__${randomParticipantPostfix}`,
        name: participantName,
        metadata,
      },
      roomName
    )

    const rooms = await svc.listRooms()

    try {
      if (!rooms.some((room) => room.name === roomName)) {
        await svc.createRoom({
          name: roomName,
          metadata: JSON.stringify({ polling: [] }),
          emptyTimeout: 10 * 60, // 10 minutes
        })
      }
    } catch {}

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    }

    // Change this for testing
    let interceptor: ConnectionInterceptor | null = null

    interceptor = (process.env.LIVEKIT_API_INTERCEPTOR ?? null) as never

    if (!interceptor || interceptor === ConnectionInterceptor.Pending) {
      return new NextResponse(JSON.stringify({ ...data, interceptor }), {
        status: !interceptor ? 200 : 307,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
        },
      })
    }

    return new NextResponse(JSON.stringify({ interceptor }), { status: 500 })
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 })
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo)
  at.ttl = '5m'
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  }
  at.addGrant(grant)
  return at.toJwt()
}

function getCookieExpirationTime(): string {
  var now = new Date()
  var time = now.getTime()
  var expireTime = time + 60 * 120 * 1000
  now.setTime(expireTime)
  return now.toUTCString()
}
