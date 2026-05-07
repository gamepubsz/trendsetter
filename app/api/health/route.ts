import { NextResponse } from "next/server";
import { contentPlans, trendSignals } from "@/lib/mock-data";
import { estimateTokenSpend } from "@/lib/cost-controls";
import { getReleaseReadiness } from "@/lib/security-checks";

export function GET() {
  return NextResponse.json({
    status: "ok",
    product: "trendsetter",
    modules: ["channels", "trend-radar", "content-pipeline", "cost-controls", "safety-checks"],
    trendSignals: trendSignals.length,
    tokenSpend: estimateTokenSpend(contentPlans),
    releaseReadiness: getReleaseReadiness(),
  });
}
