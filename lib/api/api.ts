// lib/api.ts

type TokenResponse = {
  token: string
  room: string
  identity: string
  host: string
}

const BASE =
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

function getAuthToken(): string {
  if (typeof window === "undefined") {
    throw new Error("Token hanya bisa diambil di client")
  }

  const token = localStorage.getItem("vc_token")
  if (!token) {
    throw new Error("Not authenticated: JWT token tidak ditemukan")
  }

  return token
}

export async function fetchToken(
  room: string,
  _identity?: string
): Promise<{
  token: string
  serverUrl: string
  room: string
  identity: string
}> {
  const jwt = getAuthToken()

  const res = await fetch(`${BASE}/api/livekit/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    cache: "no-store",
    body: JSON.stringify({ room }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Failed to fetch LiveKit token: ${res.status} ${text}`)
  }

  const data = (await res.json()) as TokenResponse

  if (!data.host || !data.host.trim()) {
    throw new Error(
      "Backend mengembalikan host kosong. Pastikan LIVEKIT_SERVER_URL di backend sudah diset (contoh: http://livekit.10.70.0.45:7880)."
    )
  }

  return {
    token: data.token,
    serverUrl: normalizeServerUrl(data.host),
    room: data.room,
    identity: data.identity,
  }
}
