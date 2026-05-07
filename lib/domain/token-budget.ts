import type { ModelTier, TokenBudgetPolicy } from "@/lib/types";
import { tokenPolicies } from "@/lib/mock-data";

const stagePriority: Record<TokenBudgetPolicy["stage"], number> = {
  research: 1,
  planning: 2,
  script: 3,
  optimization: 1,
};

export function getTokenPolicy(stage: TokenBudgetPolicy["stage"]): TokenBudgetPolicy {
  const policy = tokenPolicies.find((item) => item.stage === stage);

  if (!policy) {
    throw new Error(`Missing token policy for stage: ${stage}`);
  }

  return policy;
}

export function chooseModelTier(
  stage: TokenBudgetPolicy["stage"],
  confidence: number,
): ModelTier {
  const priority = stagePriority[stage];

  if (priority === 3 && confidence >= 85) {
    return "premium";
  }

  if (priority >= 2 || confidence >= 70) {
    return "balanced";
  }

  return "tiny";
}

export function estimateBatchTokenLoad(items: number, averageItemTokens: number): number {
  return items * averageItemTokens;
}

export function shouldSummarizeFirst(items: number, averageItemTokens: number): boolean {
  return estimateBatchTokenLoad(items, averageItemTokens) > 3200;
}
