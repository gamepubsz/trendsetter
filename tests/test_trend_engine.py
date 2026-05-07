from app.services.trend_engine import TrendEngine


def test_trend_engine_returns_ranked_insights() -> None:
    engine = TrendEngine(cache_ttl_seconds=30)
    results = engine.analyze(["youtube", "tiktok", "google_trends"], limit_per_platform=2)

    assert results
    assert results[0].aggregate_score >= 0
    assert all(item.platform_coverage >= 1 for item in results)
