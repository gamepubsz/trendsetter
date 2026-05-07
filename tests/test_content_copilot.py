from app.models import ChannelProfile
from app.services.content_copilot import ContentCopilot
from app.services.token_budget import TokenBudgetManager
from app.services.trend_engine import TrendEngine


def test_content_copilot_generates_plan_with_token_estimate() -> None:
    trend = TrendEngine(cache_ttl_seconds=30).analyze(["youtube"], limit_per_platform=1)[0]
    manager = TokenBudgetManager(daily_budget=5_000, per_request_cap=2_000)
    copilot = ContentCopilot(token_manager=manager, cache_ttl_seconds=30)
    profile = ChannelProfile(channel_id="c1", name="Demo", niche="AI tools", language="zh-CN", target_market="global")

    plan = copilot.generate_plan(profile, trend, "Increase ad revenue", preferred_model_tier="small")

    assert plan.token_usage_estimate > 0
    assert len(plan.title_options) == 3
    assert manager.used_today == plan.token_usage_estimate
