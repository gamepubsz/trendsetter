"""Analytics and reporting endpoints."""
from datetime import datetime, date, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.channel import Channel
from app.models.video import Video
from app.models.token_usage import TokenUsage
from app.models.ai_cache import AICache
from app.models.content_idea import ContentIdea
from app.services import ai_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db)):
    """Top-level dashboard numbers."""
    own_channels = db.query(Channel).filter(Channel.is_own_channel == True).all()
    total_subs = sum(ch.subscriber_count for ch in own_channels)
    total_views = sum(ch.view_count for ch in own_channels)
    total_videos = sum(ch.video_count for ch in own_channels)

    # Content pipeline stats
    ideas_by_status = (
        db.query(ContentIdea.status, func.count(ContentIdea.id))
        .group_by(ContentIdea.status)
        .all()
    )

    # Token usage today
    today = date.today()
    today_usage = db.query(func.sum(TokenUsage.total_tokens)).filter(TokenUsage.usage_date == today).scalar() or 0
    today_cost = db.query(func.sum(TokenUsage.estimated_cost_usd)).filter(TokenUsage.usage_date == today).scalar() or 0.0

    return {
        "channels": {
            "total": len(own_channels),
            "subscriber_count": total_subs,
            "view_count": total_views,
            "video_count": total_videos,
        },
        "content_pipeline": {s: c for s, c in ideas_by_status},
        "ai_today": {
            "tokens_used": int(today_usage),
            "cost_usd": round(float(today_cost), 4),
        },
    }


@router.get("/channels/{channel_id}/performance")
def channel_performance(
    channel_id: int,
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Video performance breakdown for a channel."""
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    videos = (
        db.query(Video)
        .filter(Video.channel_id == channel_id, Video.published_at >= cutoff)
        .order_by(Video.view_count.desc())
        .limit(50)
        .all()
    )

    if not videos:
        return {"channel_id": channel_id, "videos": [], "summary": {}}

    total_views = sum(v.view_count for v in videos)
    total_likes = sum(v.like_count for v in videos)
    avg_views = total_views / len(videos) if videos else 0
    engagement_rate = (total_likes / total_views * 100) if total_views > 0 else 0

    top_videos = sorted(videos, key=lambda v: v.view_count, reverse=True)[:5]

    return {
        "channel_id": channel_id,
        "channel_title": ch.title,
        "period_days": days,
        "summary": {
            "total_videos": len(videos),
            "total_views": total_views,
            "avg_views_per_video": round(avg_views, 0),
            "total_likes": total_likes,
            "engagement_rate_pct": round(engagement_rate, 2),
        },
        "top_videos": [
            {
                "youtube_video_id": v.youtube_video_id,
                "title": v.title,
                "view_count": v.view_count,
                "like_count": v.like_count,
                "published_at": v.published_at.isoformat() if v.published_at else None,
            }
            for v in top_videos
        ],
        "videos_by_views": [
            {
                "youtube_video_id": v.youtube_video_id,
                "title": v.title[:60],
                "view_count": v.view_count,
                "like_count": v.like_count,
                "published_at": v.published_at.isoformat() if v.published_at else None,
            }
            for v in videos
        ],
    }


@router.get("/channels/{channel_id}/ai-strategy")
def channel_ai_strategy(channel_id: int, db: Session = Depends(get_db)):
    """Generate AI-powered strategic recommendations for a channel."""
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    top_videos = (
        db.query(Video)
        .filter(Video.channel_id == channel_id)
        .order_by(Video.view_count.desc())
        .limit(10)
        .all()
    )

    try:
        result = ai_service.analyze_channel_strategy(
            db,
            channel_data={
                "title": ch.title,
                "subscriber_count": ch.subscriber_count,
                "view_count": ch.view_count,
                "video_count": ch.video_count,
            },
            top_videos=[
                {"title": v.title, "view_count": v.view_count}
                for v in top_videos
            ],
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.get("/tokens")
def token_usage(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Token usage and cost report."""
    from app.config import get_settings
    settings = get_settings()

    cutoff = date.today() - timedelta(days=days)
    records = (
        db.query(
            TokenUsage.usage_date,
            TokenUsage.model,
            TokenUsage.task_type,
            func.sum(TokenUsage.total_tokens).label("total_tokens"),
            func.sum(TokenUsage.estimated_cost_usd).label("total_cost"),
            func.sum(TokenUsage.cache_hits).label("cache_hits"),
        )
        .filter(TokenUsage.usage_date >= cutoff)
        .group_by(TokenUsage.usage_date, TokenUsage.model, TokenUsage.task_type)
        .order_by(desc(TokenUsage.usage_date))
        .all()
    )

    # Daily totals
    daily: dict[str, dict] = {}
    for r in records:
        day_str = r.usage_date.isoformat()
        if day_str not in daily:
            daily[day_str] = {"tokens": 0, "cost_usd": 0.0, "cache_hits": 0}
        daily[day_str]["tokens"] += r.total_tokens
        daily[day_str]["cost_usd"] += float(r.total_cost or 0)
        daily[day_str]["cache_hits"] += r.cache_hits

    # Cache hit count total
    total_cache_hits = db.query(func.sum(AICache.hit_count)).scalar() or 0

    # Today budget
    today = date.today()
    today_tokens = (
        db.query(func.sum(TokenUsage.total_tokens))
        .filter(TokenUsage.usage_date == today)
        .scalar()
        or 0
    )
    budget = settings.openai_daily_token_budget
    budget_remaining = max(0, budget - int(today_tokens)) if budget > 0 else None

    return {
        "period_days": days,
        "daily_usage": [
            {"date": k, **v, "cost_usd": round(v["cost_usd"], 4)}
            for k, v in sorted(daily.items())
        ],
        "totals": {
            "tokens": sum(v["tokens"] for v in daily.values()),
            "cost_usd": round(sum(v["cost_usd"] for v in daily.values()), 4),
        },
        "cache": {
            "total_hits": int(total_cache_hits),
            "estimated_tokens_saved": int(total_cache_hits) * 500,  # rough estimate
        },
        "budget": {
            "daily_limit": budget,
            "used_today": int(today_tokens),
            "remaining_today": budget_remaining,
        },
    }


@router.get("/tokens/breakdown")
def token_breakdown(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """Token usage breakdown by task type."""
    cutoff = date.today() - timedelta(days=days)
    records = (
        db.query(
            TokenUsage.task_type,
            func.sum(TokenUsage.total_tokens).label("total_tokens"),
            func.sum(TokenUsage.estimated_cost_usd).label("total_cost"),
            func.count(TokenUsage.id).label("call_count"),
        )
        .filter(TokenUsage.usage_date >= cutoff)
        .group_by(TokenUsage.task_type)
        .order_by(desc("total_tokens"))
        .all()
    )
    return [
        {
            "task_type": r.task_type,
            "total_tokens": r.total_tokens,
            "total_cost_usd": round(float(r.total_cost or 0), 4),
            "call_count": r.call_count,
        }
        for r in records
    ]
