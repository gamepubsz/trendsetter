import { NextResponse } from "next/server";
import { getPrioritizedTrendSignals, getYouTubeTrendIntegrationPlan } from "@/lib/youtube-trends";

export function GET() {
  return NextResponse.json({
    integration: getYouTubeTrendIntegrationPlan(),
    signals: getPrioritizedTrendSignals(),
  });
}
