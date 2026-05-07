import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForYouTubeSession } from "@/lib/youtube/client";
import { YOUTUBE_SESSION_COOKIE, YOUTUBE_STATE_COOKIE } from "@/lib/youtube/constants";
import { encryptYouTubeSession } from "@/lib/youtube/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.cookies.get(YOUTUBE_STATE_COOKIE)?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings?youtube=oauth-error", url.origin),
    );
  }

  try {
    const session = await exchangeCodeForYouTubeSession(code);
    const response = NextResponse.redirect(
      new URL("/settings?youtube=connected", url.origin),
    );

    response.cookies.set({
      name: YOUTUBE_SESSION_COOKIE,
      value: encryptYouTubeSession(session),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
    });
    response.cookies.set({
      name: YOUTUBE_STATE_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/settings?youtube=oauth-error", url.origin),
    );
  }
}
