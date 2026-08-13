const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

const SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email",
].join(" ");

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000";
  return `${base}/api/auth/callback`;
}

function getClientCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET manquants (voir .env.example)"
    );
  }
  return { clientId, clientSecret };
}

export function buildAuthUrl(state: string) {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: getRedirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader() {
  const { clientId, clientSecret } = getClientCredentials();
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
};

export async function exchangeCodeForToken(
  code: string
): Promise<TokenResponse | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function spotifyFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {}
) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string | null;
  externalUrl: string;
};

export async function searchTrack(
  accessToken: string,
  title: string,
  artist: string
): Promise<SpotifyTrack | null> {
  const query = artist ? `track:${title} artist:${artist}` : title;
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "1",
  });
  const res = await spotifyFetch(accessToken, `/search?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  const item = data.tracks?.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    uri: item.uri,
    name: item.name,
    artists: item.artists.map((a: { name: string }) => a.name),
    album: item.album?.name ?? "",
    imageUrl: item.album?.images?.[0]?.url ?? null,
    externalUrl: item.external_urls?.spotify ?? "",
  };
}

export async function getCurrentUser(accessToken: string) {
  const res = await spotifyFetch(accessToken, "/me");
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; display_name: string }>;
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string
) {
  const res = await spotifyFetch(accessToken, `/users/${userId}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "Créée automatiquement depuis mes Shazams",
      public: false,
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; external_urls: { spotify: string } }>;
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
) {
  // Spotify caps additions at 100 URIs per request.
  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    const res = await spotifyFetch(
      accessToken,
      `/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        body: JSON.stringify({ uris: batch }),
      }
    );
    if (!res.ok) return false;
  }
  return true;
}
