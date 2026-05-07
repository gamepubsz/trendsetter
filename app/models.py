from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SupportedPlatform = Literal["youtube", "tiktok", "x", "reddit", "google_trends"]


class TrendSignal(BaseModel):
    platform: SupportedPlatform
    topic: str
    score: float = Field(ge=0)
    velocity: float = Field(ge=0)
    url: str
    captured_at: datetime


class TrendInsight(BaseModel):
    topic: str
    aggregate_score: float
    momentum_score: float
    platform_coverage: int
    rationale: str
    source_signals: list[TrendSignal]


class ChannelProfile(BaseModel):
    channel_id: str
    name: str
    niche: str
    language: str = "zh-CN"
    target_market: str = "global"


class ContentPlan(BaseModel):
    channel_id: str
    topic: str
    title_options: list[str]
    hook: str
    script_outline: list[str]
    thumbnail_copy: str
    publish_window: str
    token_usage_estimate: int
    model_tier: Literal["small", "large"]


class AnalyticsSnapshot(BaseModel):
    channel_id: str
    views: int = Field(ge=0)
    watch_time_hours: float = Field(ge=0)
    ctr: float = Field(ge=0, le=100)
    avg_view_duration_sec: float = Field(ge=0)
    subscribers_gained: int
    revenue_usd: float = Field(ge=0)
    rpm: float = Field(ge=0)
    upload_frequency_per_week: float = Field(ge=0)


class ChannelDiagnosis(BaseModel):
    channel_id: str
    health_score: float = Field(ge=0, le=100)
    monetization_score: float = Field(ge=0, le=100)
    priority_actions: list[str]
    risks: list[str]


class SecurityAuditReport(BaseModel):
    missing_required_files: list[str]
    leaked_secrets: list[str]
    dependency_alerts: list[str]
    request_hardening_enabled: bool
