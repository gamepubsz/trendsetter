import type { Channel, ContentPlan, SafetyCheck, TrendSignal } from "./types";

export const channels: Channel[] = [
  {
    id: "ai-briefs",
    name: "AI Briefs Daily",
    niche: "AI news explained for builders",
    status: "active",
    subscribers: 12840,
    monthlyRevenueUsd: 1840,
    rpmUsd: 7.8,
    ctr: 6.4,
    averageViewDuration: "5:42",
    watchHours: 4260,
    nextMilestone: "Reach 15k subscribers with English AI explainers optimized for AdSense RPM",
  },
  {
    id: "creator-money",
    name: "Creator Money Lab",
    niche: "Monetization experiments for creators",
    status: "experiment",
    subscribers: 2360,
    monthlyRevenueUsd: 260,
    rpmUsd: 11.2,
    ctr: 4.9,
    averageViewDuration: "4:18",
    watchHours: 840,
    nextMilestone: "Validate affiliate-first topic clusters for English creator audiences",
  },
];

export const trendSignals: TrendSignal[] = [
  {
    id: "ai-agents-workflows",
    source: "YouTube",
    topic: "AI agent workflow examples",
    momentum: 92,
    competition: "medium",
    audienceIntent: "learn",
    suggestedAngle: "Show a complete channel research workflow with checkpoints and cost caps.",
  },
  {
    id: "shorts-revenue",
    source: "TikTok",
    topic: "Short-form revenue transparency",
    momentum: 86,
    competition: "low",
    audienceIntent: "compare",
    suggestedAngle: "Compare Shorts, TikTok, and affiliate revenue by audience intent.",
  },
  {
    id: "youtube-rpm",
    source: "Reddit",
    topic: "YouTube RPM by niche",
    momentum: 81,
    competition: "medium",
    audienceIntent: "buy",
    suggestedAngle: "Build a niche scoring model that balances RPM, search demand, and production cost.",
  },
  {
    id: "faceless-channels",
    source: "Google Trends",
    topic: "Faceless YouTube automation",
    momentum: 74,
    competition: "high",
    audienceIntent: "learn",
    suggestedAngle: "Position around safe operating systems instead of get-rich-quick automation.",
  },
];

export const contentPlans: ContentPlan[] = [
  {
    id: "agent-workflow-demo",
    channelId: "ai-briefs",
    title: "I Built an AI Agent That Finds YouTube Ideas Before They Trend",
    stage: "producing",
    approvalStatus: "needs_review",
    autoScheduleAfterApproval: true,
    confidence: 88,
    estimatedViews: "35k-55k",
    monetizationPath: "AdSense + affiliate tool mention",
    publishWindow: "Friday 09:00 local audience time",
    requiredChecks: [
      "Verify trend evidence from at least 3 sources",
      "Human review for claims about earnings",
      "Affiliate disclosure approved",
      "Thumbnail readability on mobile",
    ],
  },
  {
    id: "rpm-niche-scorecard",
    channelId: "creator-money",
    title: "The YouTube Niches With High RPM But Low Competition",
    stage: "researching",
    approvalStatus: "draft",
    autoScheduleAfterApproval: true,
    confidence: 79,
    estimatedViews: "12k-24k",
    monetizationPath: "AdSense + affiliate tool stack",
    publishWindow: "Tuesday 12:00 local audience time",
    requiredChecks: [
      "Avoid unverifiable income guarantees",
      "Use anonymized competitor examples",
      "Cross-check RPM ranges against YouTube analytics export",
    ],
  },
  {
    id: "shorts-funnel",
    channelId: "creator-money",
    title: "Can Shorts Actually Make Money? A Funnel-Based Answer",
    stage: "scheduled",
    approvalStatus: "scheduled",
    autoScheduleAfterApproval: true,
    confidence: 82,
    estimatedViews: "20k-40k",
    monetizationPath: "AdSense + affiliate comparison page",
    publishWindow: "Sunday 18:30 local audience time",
    requiredChecks: [
      "Disclosure copy for affiliate mentions",
      "Pinned comment CTA reviewed",
      "Retention hook under 8 seconds",
    ],
  },
];

export const safetyChecks: SafetyCheck[] = [
  {
    area: "YouTube policy",
    status: "needs_review",
    detail: "Automation may schedule only after a human approves claims, sources, metadata, and affiliate disclosures.",
  },
  {
    area: "Secrets",
    status: "ready",
    detail: "OAuth client secrets, refresh tokens, and model API keys must stay in environment variables or a secrets manager.",
  },
  {
    area: "Cost guardrails",
    status: "ready",
    detail: "Use cached trend summaries, cheap model triage, and premium model escalation only for finalists.",
  },
  {
    area: "Code integrity",
    status: "ready",
    detail: "Run lint, typecheck, build, dependency audit, and route health checks before release.",
  },
];
