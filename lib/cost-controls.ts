import type { ContentPlan, CostPolicy, TrendSignal } from "./types";

export const defaultCostPolicy: CostPolicy = {
  name: "Low-token growth research",
  goal: "Spend premium tokens only when a topic has evidence, monetization intent, and channel fit.",
  defaultModelTier: "cheap",
  escalationRule:
    "Escalate to premium only when momentum is above 80, competition is not high, and a draft has passed source checks.",
  cacheStrategy:
    "Cache raw social signals for 6 hours, trend summaries for 24 hours, and generated briefs by topic fingerprint.",
  monthlyTokenBudgetUsd: 250,
};

export function estimateTokenSpend(plans: ContentPlan[]) {
  const draftCostUsd = 0.18;
  const premiumReviewCostUsd = 0.72;
  const plannedPremiumReviews = plans.filter((plan) => plan.confidence >= 82).length;

  return {
    plannedDrafts: plans.length,
    plannedPremiumReviews,
    estimatedUsd: Number(
      (plans.length * draftCostUsd + plannedPremiumReviews * premiumReviewCostUsd).toFixed(2),
    ),
  };
}

export function shouldEscalateTrend(signal: TrendSignal) {
  return signal.momentum > 80 && signal.competition !== "high";
}
