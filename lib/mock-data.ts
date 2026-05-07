import type {
  ChannelProfile,
  ContentIdea,
  SecurityControl,
  TokenBudgetPolicy,
  TrendSignal,
} from "@/lib/types";

export const channels: ChannelProfile[] = [
  {
    id: "channel-ai-builders",
    name: "AI Builders Lab",
    niche: "AI tools for creators",
    audience: "Founders and solo creators",
    subscribers: 42800,
    monetizationStage: "monetized",
    last30DayViews: 312000,
    revenueEstimateUsd: 1840,
    uploadCadence: "2 long-form + 3 shorts / week",
  },
  {
    id: "channel-growth-desk",
    name: "Growth Desk",
    niche: "Audience growth systems",
    audience: "Operators and marketers",
    subscribers: 18100,
    monetizationStage: "eligible",
    last30DayViews: 118000,
    revenueEstimateUsd: 510,
    uploadCadence: "1 long-form + 4 shorts / week",
  },
];

export const trendSignals: TrendSignal[] = [
  {
    id: "trend-agentic-workflows",
    topic: "Agentic workflows replacing SaaS micro-tasks",
    platform: "x",
    summary:
      "Operators are sharing repeatable AI agent workflows for research, scripting, and content repurposing.",
    velocityScore: 94,
    engagementScore: 88,
    monetizationFit: 90,
    keywords: ["ai agents", "automation", "creator ops"],
    audience: "operators, creators, founders",
  },
  {
    id: "trend-short-form-case-studies",
    topic: "Short-form case studies with transparent metrics",
    platform: "youtube",
    summary:
      "Shorts that show exact view, CTR, and revenue deltas are outperforming generic growth advice.",
    velocityScore: 89,
    engagementScore: 92,
    monetizationFit: 84,
    keywords: ["youtube shorts", "case study", "ctr"],
    audience: "creators and marketers",
  },
  {
    id: "trend-reddit-friction",
    topic: "Creator frustration around analytics overload",
    platform: "reddit",
    summary:
      "Creators want fewer dashboards and more next-step recommendations tied to revenue outcomes.",
    velocityScore: 72,
    engagementScore: 85,
    monetizationFit: 79,
    keywords: ["creator analytics", "dashboard fatigue", "optimization"],
    audience: "solo creators and teams",
  },
  {
    id: "trend-google-micro-niches",
    topic: "Micro-niche educational channels",
    platform: "google-trends",
    summary:
      "Search demand is rising for focused channels that answer narrow, high-intent questions consistently.",
    velocityScore: 81,
    engagementScore: 74,
    monetizationFit: 87,
    keywords: ["micro niche", "evergreen", "high intent"],
    audience: "educators and B2B creators",
  },
];

export const seedIdeas: ContentIdea[] = [
  {
    id: "idea-ai-builders-1",
    channelId: "channel-ai-builders",
    title: "I replaced 5 creator ops tasks with one AI workflow",
    angle: "Show the before/after process and exact time savings.",
    confidence: 92,
    format: "long-form",
    sourceTrendIds: ["trend-agentic-workflows", "trend-reddit-friction"],
    estimatedImpact: "High watch time + strong sponsorship potential",
    monetizationNote: "Pairs well with workflow tool affiliate links.",
  },
  {
    id: "idea-growth-desk-1",
    channelId: "channel-growth-desk",
    title: "3 Shorts formats that lifted CTR this month",
    angle: "Break down one winning short per hook structure.",
    confidence: 88,
    format: "shorts",
    sourceTrendIds: ["trend-short-form-case-studies"],
    estimatedImpact: "Fast subscriber growth and repeatable weekly series",
    monetizationNote: "Good top-of-funnel content for ad revenue.",
  },
];

export const securityControls: SecurityControl[] = [
  {
    name: "OAuth token encryption",
    status: "ready",
    detail: "Secrets are expected server-side only and must be encrypted at rest.",
  },
  {
    name: "Scoped Google permissions",
    status: "ready",
    detail: "Plan around least-privilege scopes for YouTube Data and Analytics APIs.",
  },
  {
    name: "Prompt and request validation",
    status: "ready",
    detail: "Every API input is validated with zod before planning or generation runs.",
  },
  {
    name: "Anomaly and audit logging",
    status: "planned",
    detail: "Track token spend spikes, failed syncs, and OAuth refresh anomalies.",
  },
];

export const tokenPolicies: TokenBudgetPolicy[] = [
  {
    stage: "research",
    modelTier: "tiny",
    maxInputTokens: 2400,
    maxOutputTokens: 600,
    cacheTtlMinutes: 120,
    rationale: "Use structured trend summaries and cache aggressively.",
  },
  {
    stage: "planning",
    modelTier: "balanced",
    maxInputTokens: 4000,
    maxOutputTokens: 1200,
    cacheTtlMinutes: 60,
    rationale: "Combine channel fit, monetization fit, and recent wins.",
  },
  {
    stage: "script",
    modelTier: "premium",
    maxInputTokens: 6500,
    maxOutputTokens: 2200,
    cacheTtlMinutes: 15,
    rationale: "Reserve larger runs for high-conviction ideas only.",
  },
  {
    stage: "optimization",
    modelTier: "tiny",
    maxInputTokens: 1800,
    maxOutputTokens: 500,
    cacheTtlMinutes: 180,
    rationale: "Prefer heuristics and KPI deltas over full transcript re-analysis.",
  },
];
