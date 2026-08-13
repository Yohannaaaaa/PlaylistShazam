import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/session";
import { searchTrack } from "@/lib/spotify";

type ImportedTrack = { title: string; artist: string };

export async function POST(request: NextRequest) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const tracks: ImportedTrack[] = body.tracks ?? [];

  const results = await Promise.all(
    tracks.map(async (track) => {
      const match = await searchTrack(accessToken, track.title, track.artist);
      return { query: track, match };
    })
  );

  return NextResponse.json({ results });
}
