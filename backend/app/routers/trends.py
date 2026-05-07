"""Trend analysis endpoints."""
import json
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trend import Trend
from app.services import trend_service
from app.config import get_settings

router = APIRouter(prefix="/trends", tags=["trends"])


def _trends_to_dict(trends: list[Trend]) -> list[dict[str, Any]]:
    return [
        {
            "id": t.id,
            "source": t.source,
            "keyword": t.keyword,
            "title": t.title,
            "description": t.description,
            "url": t.url,
            "score": t.score,
            "category": t.category,
            "region": t.region,
            "fetched_at": t.fetched_at.isoformat() if t.fetched_at else None,
        }
        for t in trends
    ]


@router.get("/")
def list_trends(
    source: str | None = Query(None, description="Filter by source: youtube|google|reddit"),
    region: str = Query("US"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List cached trends from DB."""
    q = db.query(Trend).filter(Trend.region == region)
    if source:
        q = q.filter(Trend.source == source)
    trends = q.order_by(Trend.score.desc(), Trend.fetched_at.desc()).limit(limit).all()
    return _trends_to_dict(trends)


@router.post("/refresh")
def refresh_trends(
    region: str = Query("US"),
    db: Session = Depends(get_db),
):
    """Fetch fresh trends from all sources and store in DB."""
    settings = get_settings()

    # Check cache freshness
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.trend_cache_ttl)
    latest = db.query(Trend).filter(Trend.fetched_at >= cutoff).first()
    if latest:
        return {
            "message": "Trends are fresh. No refresh needed.",
            "cached": True,
            "next_refresh_in_seconds": settings.trend_cache_ttl,
        }

    all_trends = trend_service.fetch_all_trends(region=region)
    total_saved = 0

    for source, items in all_trends.items():
        for item in items:
            trend = Trend(
                source=item["source"],
                keyword=item["keyword"][:256],
                title=item.get("title", "")[:512],
                description=item.get("description", "")[:500] if item.get("description") else None,
                url=item.get("url", "")[:512] if item.get("url") else None,
                score=item.get("score"),
                category=item.get("category", "")[:64] if item.get("category") else None,
                region=item.get("region", region),
                raw_data=json.dumps(json.loads(item["raw_data"])) if item.get("raw_data") else None,
                fetched_at=datetime.now(timezone.utc),
            )
            db.add(trend)
            total_saved += 1

    db.commit()
    return {"message": "Trends refreshed", "saved": total_saved, "sources": list(all_trends.keys())}


@router.get("/youtube-trending")
def youtube_trending(
    region: str = Query("US"),
    max_results: int = Query(25, ge=1, le=50),
):
    """Fetch live YouTube trending videos (not cached)."""
    try:
        videos = trend_service.fetch_youtube_trending(region=region, max_results=max_results)
        return {"data": videos, "count": len(videos)}
    except Exception as exc:
        raise HTTPException(502, f"Failed to fetch YouTube trending: {exc}")


@router.get("/google")
def google_trends(
    keywords: str = Query(..., description="Comma-separated keywords"),
    region: str = Query("US"),
    timeframe: str = Query("now 7-d"),
):
    """Fetch Google Trends interest data for given keywords."""
    kw_list = [k.strip() for k in keywords.split(",") if k.strip()]
    if not kw_list:
        raise HTTPException(400, "Provide at least one keyword")
    if len(kw_list) > 20:
        raise HTTPException(400, "Maximum 20 keywords per request")
    try:
        data = trend_service.fetch_google_trends(kw_list, region=region, timeframe=timeframe)
        return {"data": data, "count": len(data)}
    except Exception as exc:
        raise HTTPException(502, f"Failed to fetch Google Trends: {exc}")


@router.get("/reddit")
def reddit_trends(
    subreddits: str | None = Query(None, description="Comma-separated subreddit names"),
    limit: int = Query(25, ge=1, le=50),
):
    """Fetch hot Reddit posts from YouTube-relevant subreddits."""
    subs = [s.strip() for s in subreddits.split(",")] if subreddits else None
    try:
        data = trend_service.fetch_reddit_trends(subreddits=subs, limit=limit)
        return {"data": data, "count": len(data)}
    except Exception as exc:
        raise HTTPException(502, f"Failed to fetch Reddit trends: {exc}")


@router.get("/summary")
def trends_summary(db: Session = Depends(get_db)):
    """Aggregated view of top trends across all sources."""
    from sqlalchemy import func
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    counts = (
        db.query(Trend.source, func.count(Trend.id).label("count"))
        .filter(Trend.fetched_at >= cutoff)
        .group_by(Trend.source)
        .all()
    )
    top_per_source: dict[str, list] = {}
    for row in counts:
        top = (
            db.query(Trend)
            .filter(Trend.source == row.source, Trend.fetched_at >= cutoff)
            .order_by(Trend.score.desc())
            .limit(5)
            .all()
        )
        top_per_source[row.source] = [t.keyword for t in top]

    return {
        "last_24h_counts": {r.source: r.count for r in counts},
        "top_keywords_per_source": top_per_source,
    }
