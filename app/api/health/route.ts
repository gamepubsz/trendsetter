import { NextResponse } from "next/server";
import { contentPlans } from "@/lib/mock-data";
import { estimateTokenSpend } from "@/lib/cost-controls";
import { getReleaseReadiness } from "@/lib/security-checks";
import { productStrategy } from "@/lib/product-strategy";
import { getPrioritizedTrendSignals, getYouTubeTrendIntegrationPlan } from "@/lib/youtube-trends";

export function GET() {
  return NextResponse.json({
    status: "ok",
    product: "trendsetter",
    modules: ["channels", "trend-radar", "content-pipeline", "cost-controls", "safety-checks"],
    strategy: productStrategy,
    trendSignals: getPrioritizedTrendSignals().length,
    youtubeIntegration: getYouTubeTrendIntegrationPlan(),
    tokenSpend: estimateTokenSpend(contentPlans),
    releaseReadiness: getReleaseReadiness(),
  });
}
