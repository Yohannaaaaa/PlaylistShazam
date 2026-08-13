import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/spotify";
import { setTokens } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("ps_oauth_state")?.value;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${base}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${base}/?error=state_mismatch`);
  }

  const token = await exchangeCodeForToken(code);
  if (!token) {
    return NextResponse.redirect(`${base}/?error=token_exchange_failed`);
  }

  await setTokens({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresInSeconds: token.expires_in,
  });

  const response = NextResponse.redirect(`${base}/import`);
  response.cookies.delete("ps_oauth_state");
  return response;
}
