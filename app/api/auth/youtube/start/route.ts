import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube/client";
import { YOUTUBE_STATE_COOKIE } from "@/lib/youtube/constants";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const state = crypto.randomUUID();
    const url = getYouTubeAuthUrl(state);
    const response = NextResponse.redirect(url);

    response.cookies.set({
      name: YOUTUBE_STATE_COOKIE,
      value: state,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch {
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/settings?youtube=config-error", url.origin));
  }
}
