from __future__ import annotations

from datetime import datetime, timezone
from random import Random

from app.models import SupportedPlatform, TrendSignal


BASE_TOPICS: dict[SupportedPlatform, list[tuple[str, str]]] = {
    "youtube": [
        ("AI productivity workflows", "https://www.youtube.com/feed/trending"),
        ("Side hustle automation", "https://www.youtube.com/feed/trending"),
        ("Remote work setup upgrades", "https://www.youtube.com/feed/trending"),
    ],
    "tiktok": [
        ("Short-form storytelling hooks", "https://www.tiktok.com/trending"),
        ("UGC product explainers", "https://www.tiktok.com/trending"),
        ("No-face creator strategy", "https://www.tiktok.com/trending"),
    ],
    "x": [
        ("AI agent news", "https://x.com/explore/tabs/trending"),
        ("Creator economy updates", "https://x.com/explore/tabs/trending"),
        ("Global market sentiment", "https://x.com/explore/tabs/trending"),
    ],
    "reddit": [
        ("Best niches for faceless channels", "https://www.reddit.com/r/youtube"),
        ("Monetization policy changes", "https://www.reddit.com/r/PartneredYoutube"),
        ("Retention optimization experiments", "https://www.reddit.com/r/NewTubers"),
    ],
    "google_trends": [
        ("How to use AI for content creation", "https://trends.google.com"),
        ("YouTube Shorts monetization", "https://trends.google.com"),
        ("Beginner YouTube growth strategy", "https://trends.google.com"),
    ],
}


class MockTrendSource:
    def __init__(self, platform: SupportedPlatform) -> None:
        self.platform = platform

    def fetch(self, limit: int = 5) -> list[TrendSignal]:
        seeded_random = Random(f"{self.platform}:{datetime.now(timezone.utc).date().isoformat()}")
        rows = BASE_TOPICS[self.platform][:limit]
        signals: list[TrendSignal] = []
        for topic, url in rows:
            signals.append(
                TrendSignal(
                    platform=self.platform,
                    topic=topic,
                    score=round(seeded_random.uniform(55, 100), 2),
                    velocity=round(seeded_random.uniform(20, 95), 2),
                    url=url,
                    captured_at=datetime.now(timezone.utc),
                )
            )
        return signals


def build_sources(platforms: list[SupportedPlatform]) -> list[MockTrendSource]:
    return [MockTrendSource(platform=platform) for platform in platforms]
