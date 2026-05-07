import { safetyChecks } from "./mock-data";

export function getReleaseReadiness() {
  const blocked = safetyChecks.filter((check) => check.status === "blocked");
  const needsReview = safetyChecks.filter((check) => check.status === "needs_review");

  return {
    canRelease: blocked.length === 0,
    blockedCount: blocked.length,
    needsReviewCount: needsReview.length,
    requiredCommands: ["npm run lint", "npm run typecheck", "npm run build", "npm audit"],
  };
}
