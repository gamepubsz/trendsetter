import { NextResponse } from "next/server";
import { YOUTUBE_SESSION_COOKIE, YOUTUBE_STATE_COOKIE } from "@/lib/youtube/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/settings?youtube=disconnected", url.origin));

  for (const name of [YOUTUBE_SESSION_COOKIE, YOUTUBE_STATE_COOKIE]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
