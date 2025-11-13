// lib/api.ts
type TokenResponse = {
  token: string;
  room: string;
  identity: string;
  host: string; 
};

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:8080";

export function normalizeServerUrl(hostFromBackend: string): string {
  try {
    const url = new URL(hostFromBackend);
    if (url.protocol === "http:") url.protocol = "ws:";
    if (url.protocol === "https:") url.protocol = "wss:";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return hostFromBackend;
  }
}

export async function fetchToken(room: string, identity: string): Promise<{
  token: string;
  serverUrl: string;
  room: string;
  identity: string;
}> {
  const res = await fetch(`${BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ room, identity }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch token: ${res.status} ${text}`);
  }

  const data = (await res.json()) as TokenResponse;

  if (!data.host || !data.host.trim()) {
    throw new Error(
      "Backend mengembalikan host kosong. Set LIVEKIT_SERVER_URL di backend (contoh: http://192.168.100.130:7880)."
    );
  }

  return {
    token: data.token,
    serverUrl: normalizeServerUrl(data.host),
    room: data.room,
    identity: data.identity,
  };
}
