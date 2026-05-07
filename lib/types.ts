export type ChannelStage = "researching" | "producing" | "ready_for_review" | "scheduled" | "published";

export type ProductStrategy = {
  primaryContentLanguage: "English";
  primaryTrendSource: "YouTube";
  publishingMode: "auto_schedule_after_approval";
  monetizationPriority: ["ads", "affiliate"];
  approvalRule: string;
};

export type Channel = {
  id: string;
  name: string;
  niche: string;
  status: "active" | "experiment" | "paused";
  subscribers: number;
  monthlyRevenueUsd: number;
  rpmUsd: number;
  ctr: number;
  averageViewDuration: string;
  watchHours: number;
  nextMilestone: string;
};

export type TrendSignal = {
  id: string;
  source: "YouTube" | "TikTok" | "Reddit" | "Google Trends" | "X";
  topic: string;
  momentum: number;
  competition: "low" | "medium" | "high";
  audienceIntent: "learn" | "buy" | "compare" | "entertain";
  suggestedAngle: string;
};

export type ContentPlan = {
  id: string;
  channelId: string;
  title: string;
  stage: ChannelStage;
  approvalStatus: "draft" | "needs_review" | "approved" | "scheduled";
  autoScheduleAfterApproval: boolean;
  confidence: number;
  estimatedViews: string;
  monetizationPath: string;
  publishWindow: string;
  requiredChecks: string[];
};

export type CostPolicy = {
  name: string;
  goal: string;
  defaultModelTier: "cheap" | "balanced" | "premium";
  escalationRule: string;
  cacheStrategy: string;
  monthlyTokenBudgetUsd: number;
};

export type SafetyCheck = {
  area: string;
  status: "ready" | "needs_review" | "blocked";
  detail: string;
};
