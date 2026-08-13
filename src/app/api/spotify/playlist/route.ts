import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/session";
import { addTracksToPlaylist, createPlaylist, getCurrentUser } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const name: string = body.name?.trim() || "Mes Shazams";
  const trackUris: string[] = body.trackUris ?? [];

  if (trackUris.length === 0) {
    return NextResponse.json({ error: "no_tracks" }, { status: 400 });
  }

  const user = await getCurrentUser(accessToken);
  if (!user) {
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 502 });
  }

  const playlist = await createPlaylist(accessToken, user.id, name);
  if (!playlist) {
    return NextResponse.json({ error: "playlist_creation_failed" }, { status: 502 });
  }

  const added = await addTracksToPlaylist(accessToken, playlist.id, trackUris);
  if (!added) {
    return NextResponse.json({ error: "add_tracks_failed" }, { status: 502 });
  }

  return NextResponse.json({
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls.spotify,
  });
}
