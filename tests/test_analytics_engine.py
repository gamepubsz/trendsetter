from app.models import AnalyticsSnapshot
from app.services.analytics_engine import AnalyticsEngine


def test_analytics_engine_respects_monetization_priorities() -> None:
    engine = AnalyticsEngine()
    snapshot = AnalyticsSnapshot(
        channel_id="c1",
        views=10000,
        watch_time_hours=120.0,
        ctr=3.9,
        avg_view_duration_sec=95,
        subscribers_gained=60,
        revenue_usd=80.0,
        rpm=1.5,
        upload_frequency_per_week=1.0,
    )

    diagnosis = engine.diagnose(
        snapshot=snapshot,
        trend_alignment_score=58,
        monetization_priorities=["ads", "affiliate"],
    )

    joined_actions = " ".join(diagnosis.priority_actions).lower()
    assert "ad" in joined_actions
    assert "affiliate" in joined_actions
    assert diagnosis.monetization_priorities == ["ads", "affiliate"]
