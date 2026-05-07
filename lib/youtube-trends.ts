import { trendSignals } from "./mock-data";
import { productStrategy } from "./product-strategy";

export function getPrioritizedTrendSignals() {
  return [...trendSignals].sort((left, right) => {
    if (left.source === productStrategy.primaryTrendSource && right.source !== productStrategy.primaryTrendSource) {
      return -1;
    }

    if (right.source === productStrategy.primaryTrendSource && left.source !== productStrategy.primaryTrendSource) {
      return 1;
    }

    return right.momentum - left.momentum;
  });
}

export function getYouTubeTrendIntegrationPlan() {
  return {
    source: productStrategy.primaryTrendSource,
    firstApiTargets: [
      "search.list for topic discovery",
      "videos.list for view velocity and engagement",
      "channels.list for competitor positioning",
      "YouTube Analytics API for owned-channel feedback loops",
    ],
    safeguards: [
      "Respect YouTube API quota limits",
      "Cache normalized trend snapshots",
      "Store source URLs and observed timestamps",
      "Do not auto-publish without approval",
    ],
  };
}
