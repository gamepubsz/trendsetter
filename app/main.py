from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models import (
    AnalyticsSnapshot,
    ChannelDiagnosis,
    ChannelProfile,
    ContentPlan,
    MonetizationChannel,
    PublicationRequest,
    ScheduledPublication,
    SecurityAuditReport,
    SupportedPlatform,
    TrendInsight,
)
from app.services.analytics_engine import AnalyticsEngine
from app.services.content_copilot import ContentCopilot
from app.services.publishing_scheduler import PublishingScheduler
from app.services.security_guard import SecurityGuard
from app.services.token_budget import TokenBudgetManager
from app.services.trend_engine import TrendEngine

settings = get_settings()
trend_engine = TrendEngine(cache_ttl_seconds=settings.cache_ttl_seconds)
token_manager = TokenBudgetManager(
    daily_budget=settings.daily_token_budget,
    per_request_cap=settings.per_request_token_cap,
)
content_copilot = ContentCopilot(
    token_manager=token_manager,
    cache_ttl_seconds=settings.cache_ttl_seconds,
)
analytics_engine = AnalyticsEngine()
security_guard = SecurityGuard(workspace_path=Path(__file__).resolve().parents[1])
publishing_scheduler = PublishingScheduler()

app = FastAPI(title=settings.app_name, version="0.1.0")


class TrendRequest(BaseModel):
    platforms: list[SupportedPlatform] = Field(default_factory=lambda: ["youtube"])
    limit_per_platform: int = Field(default=3, ge=1, le=10)


class ContentPlanRequest(BaseModel):
    channel: ChannelProfile
    trend: TrendInsight
    objective: str
    preferred_model_tier: str = Field(default="small")
    monetization_priorities: list[MonetizationChannel] = Field(default_factory=lambda: ["ads", "affiliate"])


class DiagnoseRequest(BaseModel):
    snapshot: AnalyticsSnapshot
    trend_alignment_score: float = Field(default=70, ge=0, le=100)
    monetization_priorities: list[MonetizationChannel] = Field(default_factory=lambda: ["ads", "affiliate"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.post("/trends/analyze", response_model=list[TrendInsight])
def analyze_trends(payload: TrendRequest) -> list[TrendInsight]:
    return trend_engine.analyze(payload.platforms, payload.limit_per_platform)


@app.post("/content/plan", response_model=ContentPlan)
def generate_content_plan(payload: ContentPlanRequest) -> ContentPlan:
    return content_copilot.generate_plan(
        channel=payload.channel,
        trend=payload.trend,
        objective=payload.objective,
        preferred_model_tier=payload.preferred_model_tier,
        monetization_priorities=payload.monetization_priorities,
    )


@app.post("/analytics/diagnose", response_model=ChannelDiagnosis)
def diagnose_channel(payload: DiagnoseRequest) -> ChannelDiagnosis:
    return analytics_engine.diagnose(
        payload.snapshot,
        payload.trend_alignment_score,
        monetization_priorities=payload.monetization_priorities,
    )


@app.post("/publishing/schedule", response_model=ScheduledPublication)
def create_schedule(payload: PublicationRequest) -> ScheduledPublication:
    return publishing_scheduler.create_or_schedule(payload)


@app.post("/publishing/approve/{schedule_id}", response_model=ScheduledPublication)
def approve_schedule(schedule_id: str) -> ScheduledPublication:
    try:
        return publishing_scheduler.approve_and_schedule(schedule_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Schedule not found") from exc


@app.get("/publishing/schedules", response_model=list[ScheduledPublication])
def list_schedules(channel_id: str | None = None) -> list[ScheduledPublication]:
    return publishing_scheduler.list_schedules(channel_id=channel_id)


@app.get("/security/audit", response_model=SecurityAuditReport)
def run_security_audit() -> SecurityAuditReport:
    return security_guard.run_audit()


@app.get("/dashboard/summary")
def dashboard_summary() -> dict[str, object]:
    trends = trend_engine.analyze(["youtube"], limit_per_platform=3)
    top = trends[0] if trends else None
    return {
        "top_trend": top.topic if top else None,
        "trend_count": len(trends),
        "token_used_today": token_manager.used_today,
        "token_remaining_today": token_manager.remaining_today,
        "default_language": settings.default_language,
        "monetization_priorities": settings.default_monetization_priorities.split(","),
    }
