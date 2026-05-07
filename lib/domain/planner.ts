import { channels, trendSignals } from "@/lib/mock-data";
import { getRecommendedIdeas } from "@/lib/domain/dashboard";
import { chooseModelTier, getTokenPolicy } from "@/lib/domain/token-budget";
import type { ContentPlanRequest, GeneratedPlan, TokenBudgetPolicy } from "@/lib/types";

export function generateContentPlan(input: ContentPlanRequest): GeneratedPlan {
  const channel = channels.find((item) => item.id === input.channelId);

  if (!channel) {
    throw new Error(`Unknown channel: ${input.channelId}`);
  }

  const selectedTrends = trendSignals
    .filter((trend) => {
      const haystack = `${trend.topic} ${trend.summary} ${trend.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(input.focus.toLowerCase());
    })
    .slice(0, 2);

  const ideas = getRecommendedIdeas(channel.id).slice(0, 3);
  const basePolicy = getTokenPolicy("planning");
  const highestConfidence = ideas[0]?.confidence ?? 70;

  const tokenPolicy: TokenBudgetPolicy = {
    ...basePolicy,
    modelTier: chooseModelTier("planning", highestConfidence),
  };

  const outline = [
    `Hook with the pain point for ${channel.audience}.`,
    `Summarize why "${input.focus}" is rising across creator conversations.`,
    "Show one measurable workflow or content experiment.",
    "Translate that tactic into a repeatable upload or shorts series.",
    "Close with the next KPI to monitor on the dashboard.",
  ];

  return {
    channel,
    selectedTrends: selectedTrends.length > 0 ? selectedTrends : trendSignals.slice(0, 2),
    ideas,
    tokenPolicy,
    outline,
  };
}
