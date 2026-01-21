type TokenResponse = {
  token: string
  room: string
  room_name?: string
  identity: string
  host: string
  is_waiting?: boolean
}

export const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080"

export function normalizeServerUrl(hostFromBackend: string): string {
  try {
    const url = new URL(hostFromBackend)
    if (url.protocol === "http:") url.protocol = "ws:"
    if (url.protocol === "https:") url.protocol = "wss:"
    return url.toString().replace(/\/+$/, "")
  } catch {
    return hostFromBackend
  }
}

export function getAuthToken(): string {
  if (typeof window === "undefined") {
    throw new Error("Token hanya bisa diambil di client")
  }

  const token = localStorage.getItem("vc_token")
  if (!token) {
    throw new Error("Not authenticated: JWT token tidak ditemukan")
  }

  return token
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchToken(
  room: string,
  _identity?: string
): Promise<{
  token: string
  serverUrl: string
  room: string
  identity: string
  roomName?: string
  isWaiting?: boolean
}> {

  const jwt = getAuthToken()

  const res = await fetch(`${API_URL}/api/livekit/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    cache: "no-store",
    body: JSON.stringify({ room_code: room }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const errorMessage = errorData.error || await res.text()
    throw new Error(`Failed to fetch LiveKit token: ${res.status} - ${errorMessage}`)
  }

  const data = (await res.json()) as TokenResponse

  if (!data.host || !data.host.trim()) {
    throw new Error(
      "Backend mengembalikan host kosong. Pastikan LIVEKIT_SERVER_URL di backend sudah diset."
    )
  }

  return {
    token: data.token,
    serverUrl: normalizeServerUrl(data.host),
    room: data.room,
    roomName: data.room_name,
    identity: data.identity,
    isWaiting: data.is_waiting,
  }
}


export async function leaveRoomBackend(): Promise<void> {
  const jwt = getAuthToken()
  await fetch(`${API_URL}/api/livekit/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    cache: "no-store",
  })
}