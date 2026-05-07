export type SocialPlatform =
  | "youtube"
  | "tiktok"
  | "x"
  | "reddit"
  | "google-trends";

export type MonetizationStage = "building" | "eligible" | "monetized";

export type ModelTier = "tiny" | "balanced" | "premium";

export interface KpiMetric {
  label: string;
  value: string;
  change: string;
  direction: "up" | "down" | "flat";
}

export interface TrendSignal {
  id: string;
  topic: string;
  platform: SocialPlatform;
  summary: string;
  velocityScore: number;
  engagementScore: number;
  monetizationFit: number;
  keywords: string[];
  audience: string;
}

export interface ChannelProfile {
  id: string;
  name: string;
  niche: string;
  audience: string;
  subscribers: number;
  monetizationStage: MonetizationStage;
  last30DayViews: number;
  revenueEstimateUsd: number;
  uploadCadence: string;
}

export interface ContentIdea {
  id: string;
  channelId: string;
  title: string;
  angle: string;
  confidence: number;
  format: "long-form" | "shorts" | "livestream";
  sourceTrendIds: string[];
  estimatedImpact: string;
  monetizationNote: string;
}

export interface SecurityControl {
  name: string;
  status: "ready" | "planned";
  detail: string;
}

export interface TokenBudgetPolicy {
  stage: "research" | "planning" | "script" | "optimization";
  modelTier: ModelTier;
  maxInputTokens: number;
  maxOutputTokens: number;
  cacheTtlMinutes: number;
  rationale: string;
}

export interface DashboardData {
  headline: string;
  overview: KpiMetric[];
  channels: ChannelProfile[];
  trends: TrendSignal[];
  ideas: ContentIdea[];
  securityControls: SecurityControl[];
  tokenPolicies: TokenBudgetPolicy[];
}

export interface ContentPlanRequest {
  channelId: string;
  focus: string;
}

export interface GeneratedPlan {
  channel: ChannelProfile;
  selectedTrends: TrendSignal[];
  ideas: ContentIdea[];
  tokenPolicy: TokenBudgetPolicy;
  outline: string[];
}
