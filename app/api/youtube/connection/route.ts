import { NextResponse } from "next/server";
import { getYouTubeConnectionStatus } from "@/lib/youtube/service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getYouTubeConnectionStatus());
}
