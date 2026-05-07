import { channels, seedIdeas, securityControls, tokenPolicies, trendSignals } from "@/lib/mock-data";
import type { ContentIdea, DashboardData, KpiMetric, TrendSignal } from "@/lib/types";

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function buildOverview(): KpiMetric[] {
  const totalViews = channels.reduce((sum, channel) => sum + channel.last30DayViews, 0);
  const totalRevenue = channels.reduce(
    (sum, channel) => sum + channel.revenueEstimateUsd,
    0,
  );
  const monetizedChannels = channels.filter(
    (channel) => channel.monetizationStage === "monetized",
  ).length;

  return [
    {
      label: "30-day views",
      value: formatCompactNumber(totalViews),
      change: "+18.4%",
      direction: "up",
    },
    {
      label: "Estimated revenue",
      value: `$${totalRevenue.toLocaleString("en-US")}`,
      change: "+11.2%",
      direction: "up",
    },
    {
      label: "Channels monetized",
      value: `${monetizedChannels}/${channels.length}`,
      change: "On track",
      direction: "flat",
    },
    {
      label: "Trend fit score",
      value: `${Math.round(
        trendSignals.reduce((sum, trend) => sum + trend.monetizationFit, 0) /
          trendSignals.length,
      )}`,
      change: "+6 pts",
      direction: "up",
    },
  ];
}

function scoreIdea(trend: TrendSignal, audienceFit: number, channelId: string): ContentIdea {
  const confidence = Math.min(
    97,
    Math.round(trend.velocityScore * 0.45 + trend.engagementScore * 0.35 + audienceFit * 0.2),
  );

  return {
    id: `idea-${channelId}-${trend.id}`,
    channelId,
    title: `${trend.topic}: the playbook creators can use now`,
    angle: `Turn ${trend.platform} momentum into a repeatable content series with measurable revenue hooks.`,
    confidence,
    format: confidence > 90 ? "long-form" : "shorts",
    sourceTrendIds: [trend.id],
    estimatedImpact:
      confidence > 90 ? "High-confidence pillar episode" : "Fast validation experiment",
    monetizationNote:
      trend.monetizationFit > 85
        ? "Strong ad and sponsorship alignment."
        : "Use as audience acquisition before monetization offers.",
  };
}

export function getRecommendedIdeas(channelId?: string): ContentIdea[] {
  const scopedChannels = channelId
    ? channels.filter((channel) => channel.id === channelId)
    : channels;

  const generated = scopedChannels.flatMap((channel) =>
    trendSignals.slice(0, 3).map((trend) => {
      const audienceFit = trend.audience.includes("creators") ? 92 : 78;
      return scoreIdea(trend, audienceFit, channel.id);
    }),
  );

  return [...seedIdeas, ...generated]
    .filter((idea) => (channelId ? idea.channelId === channelId : true))
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 6);
}

export function getDashboardData(): DashboardData {
  return {
    headline: "Operate one or more YouTube channels from a single trend-aware cockpit.",
    overview: buildOverview(),
    channels,
    trends: trendSignals,
    ideas: getRecommendedIdeas(),
    securityControls,
    tokenPolicies,
  };
}
