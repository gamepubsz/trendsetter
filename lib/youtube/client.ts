import { google } from "googleapis";
import { getMissingYouTubeOAuthEnv, getYouTubeRedirectUri, parseEnv } from "@/lib/env";
import { YOUTUBE_REQUIRED_SCOPES } from "@/lib/youtube/constants";
import type { YouTubeOAuthSession } from "@/lib/youtube/types";

function createOAuthClient() {
  const env = parseEnv();

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getYouTubeRedirectUri(),
  );
}

export function getYouTubeAuthUrl(state: string): string {
  const missing = getMissingYouTubeOAuthEnv();

  if (missing.length > 0) {
    throw new Error(`Missing YouTube OAuth config: ${missing.join(", ")}`);
  }

  const client = createOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    response_type: "code",
    scope: [...YOUTUBE_REQUIRED_SCOPES],
    state,
  });
}

function normalizeScopes(scope: string | null | undefined): string[] {
  if (!scope) {
    return [];
  }

  return scope
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function exchangeCodeForYouTubeSession(code: string): Promise<YouTubeOAuthSession> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Google OAuth flow did not return an access token.");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? undefined,
    expiryDate: tokens.expiry_date ?? null,
    scope: normalizeScopes(tokens.scope),
    tokenType: tokens.token_type ?? null,
  };
}

export async function getAuthorizedYouTubeClient(session: YouTubeOAuthSession) {
  const client = createOAuthClient();

  client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiryDate ?? undefined,
    scope: session.scope.join(" "),
    token_type: session.tokenType ?? undefined,
  });

  if (session.refreshToken) {
    await client.getAccessToken();
  }

  return client;
}
