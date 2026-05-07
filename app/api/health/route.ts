import { NextResponse } from "next/server";
import { getMissingCriticalEnv, getMissingYouTubeOAuthEnv, getYouTubeRedirectUri } from "@/lib/env";
import { sanitizeConfigRecord } from "@/lib/security";

export function GET() {
  return NextResponse.json({
    status: "ok",
    missingCriticalEnv: getMissingCriticalEnv(),
    missingYouTubeOAuthEnv: getMissingYouTubeOAuthEnv(),
    youtubeRedirectUri: getYouTubeRedirectUri(),
    sanitizedConfigPreview: sanitizeConfigRecord({
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      YOUTUBE_OAUTH_REDIRECT_URI: process.env.YOUTUBE_OAUTH_REDIRECT_URI,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }),
  });
}
