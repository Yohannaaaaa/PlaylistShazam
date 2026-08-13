import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/session";
import { getCurrentUser } from "@/lib/spotify";

export async function GET() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }
  const user = await getCurrentUser(accessToken);
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    displayName: user.display_name,
  });
}
