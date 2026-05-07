from __future__ import annotations

from app.models import ChannelProfile, ContentPlan, MonetizationChannel, TrendInsight
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
        monetization_priorities: list[MonetizationChannel] | None = None,
    ) -> ContentPlan:
        priorities = monetization_priorities or ["ads", "affiliate"]
        cache_key = f"{channel.channel_id}:{trend.topic}:{objective}:{preferred_model_tier}:{'-'.join(priorities)}"
        cached = self.plan_cache.get(cache_key)
        if cached is not None:
            return cached

        prompt = (
            f"Channel={channel.name}, niche={channel.niche}, language={channel.language}, "
            f"target={channel.target_market}, topic={trend.topic}, objective={objective}, "
            f"trend_score={trend.aggregate_score}, momentum={trend.momentum_score}, "
            f"monetization_priorities={','.join(priorities)}"
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
                "CTA: ask viewers to comment their bottleneck and subscribe",
            ],
            thumbnail_copy=f"{trend.topic} = FAST GROWTH?",
            publish_window="Weekday 19:00-21:00 local audience time",
            token_usage_estimate=usage.total,
            model_tier="large" if preferred_model_tier == "large" else "small",
            monetization_focus=priorities,
            monetization_hooks=self._build_monetization_hooks(priorities),
        )
        self.plan_cache.set(cache_key, plan)
        return plan

    def _build_monetization_hooks(self, priorities: list[MonetizationChannel]) -> list[str]:
        hooks: list[str] = []
        if "ads" in priorities:
            hooks.append("Keep the strongest payoff teaser before 30s to protect ad-friendly retention.")
        if "affiliate" in priorities:
            hooks.append("Insert one practical tool recommendation with transparent affiliate disclosure.")
        if "sponsorship" in priorities:
            hooks.append("Reserve a sponsor-ready slot after first value block.")
        if "digital_products" in priorities:
            hooks.append("Add a CTA to a checklist/template lead magnet in description.")
        return hooks
