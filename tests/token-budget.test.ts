import { describe, expect, it } from "vitest";
import {
  chooseModelTier,
  estimateBatchTokenLoad,
  getTokenPolicy,
  shouldSummarizeFirst,
} from "@/lib/domain/token-budget";

describe("token budget policy", () => {
  it("returns the configured policy for planning", () => {
    const policy = getTokenPolicy("planning");

    expect(policy.modelTier).toBe("balanced");
    expect(policy.maxInputTokens).toBeGreaterThan(3000);
  });

  it("upgrades script runs with high confidence", () => {
    expect(chooseModelTier("script", 91)).toBe("premium");
    expect(chooseModelTier("research", 55)).toBe("tiny");
  });

  it("flags oversized batches for summarization first", () => {
    expect(estimateBatchTokenLoad(12, 340)).toBe(4080);
    expect(shouldSummarizeFirst(12, 340)).toBe(true);
    expect(shouldSummarizeFirst(4, 300)).toBe(false);
  });
});
