import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/spotify";

const ACCESS_TOKEN_COOKIE = "ps_access_token";
const REFRESH_TOKEN_COOKIE = "ps_refresh_token";
const EXPIRES_AT_COOKIE = "ps_expires_at";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setTokens(params: {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
}) {
  const store = await cookies();
  const expiresAt = Date.now() + params.expiresInSeconds * 1000;

  store.set(ACCESS_TOKEN_COOKIE, params.accessToken, cookieOptions);
  store.set(EXPIRES_AT_COOKIE, String(expiresAt), cookieOptions);
  if (params.refreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, params.refreshToken, cookieOptions);
  }
}

export async function clearTokens() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(EXPIRES_AT_COOKIE);
}

export async function getValidAccessToken(): Promise<string | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  const expiresAt = Number(store.get(EXPIRES_AT_COOKIE)?.value ?? 0);

  if (!accessToken) return null;

  // Refresh a bit early to avoid edge-of-expiry failures.
  if (Date.now() < expiresAt - 30_000) {
    return accessToken;
  }

  if (!refreshToken) return null;

  const refreshed = await refreshAccessToken(refreshToken);
  if (!refreshed) return null;

  await setTokens({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? refreshToken,
    expiresInSeconds: refreshed.expires_in,
  });

  return refreshed.access_token;
}
