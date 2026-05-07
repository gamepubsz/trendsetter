from __future__ import annotations

from app.models import ChannelProfile, ContentPlan, TrendInsight
from app.services.cache import InMemoryTTLCache
from app.services.token_budget import TokenBudgetManager


class ContentCopilot:
    def __init__(self, token_manager: TokenBudgetManager, cache_ttl_seconds: int) -> None:
        self.token_manager = token_manager
        self.plan_cache = InMemoryTTLCache[ContentPlan](ttl_seconds=cache_ttl_seconds)

    def generate_plan(
        self,
        channel: ChannelProfile,
        trend: TrendInsight,
        objective: str,
        preferred_model_tier: str = "small",
    ) -> ContentPlan:
        cache_key = f"{channel.channel_id}:{trend.topic}:{objective}:{preferred_model_tier}"
        cached = self.plan_cache.get(cache_key)
        if cached is not None:
            return cached

        prompt = (
            f"Channel={channel.name}, niche={channel.niche}, language={channel.language}, "
            f"target={channel.target_market}, topic={trend.topic}, objective={objective}, "
            f"trend_score={trend.aggregate_score}, momentum={trend.momentum_score}"
        )
        target_output_tokens = 900 if preferred_model_tier == "large" else 420
        usage = self.token_manager.reserve(prompt, target_output_tokens=target_output_tokens)

        titles = [
            f"{trend.topic}: 7 actionable steps for {channel.niche}",
            f"{channel.niche} playbook: {trend.topic} that actually works",
            f"Stop guessing: use {trend.topic} to grow your channel",
        ]
        plan = ContentPlan(
            channel_id=channel.channel_id,
            topic=trend.topic,
            title_options=titles,
            hook=f"If you want faster YouTube growth in {channel.niche}, start with this trend right now.",
            script_outline=[
                "Opening hook with outcome in first 5 seconds",
                "Explain why this trend is growing across platforms",
                "Show 3 practical implementations for your niche",
                "Add one data-backed example and a counterexample",
                "CTA: ask viewers to comment their bottleneck",
            ],
            thumbnail_copy=f"{trend.topic} = FAST GROWTH?",
            publish_window="Weekday 19:00-21:00 local audience time",
            token_usage_estimate=usage.total,
            model_tier="large" if preferred_model_tier == "large" else "small",
        )
        self.plan_cache.set(cache_key, plan)
        return plan
