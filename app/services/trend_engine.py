from collections import defaultdict

from app.models import SupportedPlatform, TrendInsight, TrendSignal
from app.services.cache import InMemoryTTLCache
from app.services.trend_sources import build_sources


PLATFORM_WEIGHT: dict[SupportedPlatform, float] = {
    "youtube": 1.3,
    "tiktok": 1.2,
    "x": 1.0,
    "reddit": 0.9,
    "google_trends": 1.1,
}


class TrendEngine:
    def __init__(self, cache_ttl_seconds: int) -> None:
        self.cache = InMemoryTTLCache[list[TrendInsight]](ttl_seconds=cache_ttl_seconds)

    def analyze(self, platforms: list[SupportedPlatform], limit_per_platform: int = 3) -> list[TrendInsight]:
        cache_key = f"{'-'.join(sorted(platforms))}:{limit_per_platform}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        signal_map: dict[str, list[TrendSignal]] = defaultdict(list)
        for source in build_sources(platforms):
            for signal in source.fetch(limit=limit_per_platform):
                signal_map[signal.topic.lower()].append(signal)

        insights: list[TrendInsight] = []
        for grouped_signals in signal_map.values():
            topic = grouped_signals[0].topic
            weighted_score = sum(
                item.score * PLATFORM_WEIGHT[item.platform] for item in grouped_signals
            ) / max(len(grouped_signals), 1)
            momentum_score = sum(item.velocity for item in grouped_signals) / max(len(grouped_signals), 1)
            coverage = len({item.platform for item in grouped_signals})
            rationale = (
                f"Cross-platform coverage={coverage}; weighted interest={weighted_score:.1f}; "
                f"momentum={momentum_score:.1f}."
            )
            insights.append(
                TrendInsight(
                    topic=topic,
                    aggregate_score=round(weighted_score, 2),
                    momentum_score=round(momentum_score, 2),
                    platform_coverage=coverage,
                    rationale=rationale,
                    source_signals=grouped_signals,
                )
            )

        insights.sort(
            key=lambda row: (row.platform_coverage, row.aggregate_score, row.momentum_score),
            reverse=True,
        )
        self.cache.set(cache_key, insights)
        return insights
