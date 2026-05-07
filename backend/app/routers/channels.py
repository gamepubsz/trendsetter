"""Channel CRUD + YouTube sync endpoints."""
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.channel import Channel
from app.models.video import Video
from app.services import youtube_service
from app.utils.security import is_valid_youtube_channel_id, sanitize_text

router = APIRouter(prefix="/channels", tags=["channels"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChannelCreate(BaseModel):
    youtube_channel_id: str | None = None
    handle: str | None = None          # @handle - will be resolved to ID
    title: str = ""
    category: str | None = None
    is_own_channel: bool = True
    notes: str | None = None

    @field_validator("youtube_channel_id")
    @classmethod
    def validate_channel_id(cls, v):
        if v and not is_valid_youtube_channel_id(v):
            raise ValueError("Invalid YouTube channel ID format (must be UCxxxxxxxx...)")
        return v


class ChannelUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    notes: str | None = None
    is_own_channel: bool | None = None
    is_monetized: bool | None = None
    estimated_monthly_revenue_usd: float | None = None


class ChannelOut(BaseModel):
    id: int
    youtube_channel_id: str
    handle: str | None
    title: str
    description: str | None
    thumbnail_url: str | None
    country: str | None
    category: str | None
    subscriber_count: int
    view_count: int
    video_count: int
    is_monetized: bool
    estimated_monthly_revenue_usd: float | None
    is_own_channel: bool
    notes: str | None
    stats_synced_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ChannelOut])
def list_channels(
    own_only: bool = Query(False, description="Return only own channels"),
    db: Session = Depends(get_db),
):
    q = db.query(Channel)
    if own_only:
        q = q.filter(Channel.is_own_channel == True)
    return q.order_by(Channel.subscriber_count.desc()).all()


@router.post("/", response_model=ChannelOut, status_code=201)
def add_channel(payload: ChannelCreate, db: Session = Depends(get_db)):
    channel_id = payload.youtube_channel_id
    yt_data: dict[str, Any] = {}

    # Resolve handle → channel ID
    if not channel_id and payload.handle:
        yt_data = youtube_service.get_channel_by_handle(payload.handle) or {}
        channel_id = yt_data.get("youtube_channel_id")
        if not channel_id:
            raise HTTPException(404, f"Could not find YouTube channel for handle: {payload.handle}")
    elif channel_id:
        try:
            yt_data = youtube_service.get_channel_by_id(channel_id) or {}
        except Exception:
            pass  # proceed with manual data if API fails

    # Check duplicate
    existing = db.query(Channel).filter(Channel.youtube_channel_id == channel_id).first()
    if existing:
        raise HTTPException(409, f"Channel {channel_id} already exists")

    channel = Channel(
        youtube_channel_id=channel_id or "",
        title=yt_data.get("title") or payload.title or "",
        description=yt_data.get("description"),
        handle=yt_data.get("handle") or payload.handle,
        thumbnail_url=yt_data.get("thumbnail_url"),
        country=yt_data.get("country"),
        subscriber_count=yt_data.get("subscriber_count", 0),
        view_count=yt_data.get("view_count", 0),
        video_count=yt_data.get("video_count", 0),
        category=payload.category,
        is_own_channel=payload.is_own_channel,
        notes=sanitize_text(payload.notes or ""),
        stats_synced_at=datetime.now(timezone.utc) if yt_data else None,
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.get("/{channel_id}", response_model=ChannelOut)
def get_channel(channel_id: int, db: Session = Depends(get_db)):
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")
    return ch


@router.patch("/{channel_id}", response_model=ChannelOut)
def update_channel(channel_id: int, payload: ChannelUpdate, db: Session = Depends(get_db)):
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(ch, field, value)
    ch.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ch)
    return ch


@router.delete("/{channel_id}", status_code=204)
def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")
    db.delete(ch)
    db.commit()


@router.post("/{channel_id}/sync", response_model=ChannelOut)
def sync_channel(channel_id: int, db: Session = Depends(get_db)):
    """Re-fetch latest stats from YouTube API."""
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    try:
        yt_data = youtube_service.get_channel_by_id(ch.youtube_channel_id)
        if not yt_data:
            raise HTTPException(404, "Channel not found on YouTube")

        ch.title = yt_data.get("title", ch.title)
        ch.description = yt_data.get("description", ch.description)
        ch.thumbnail_url = yt_data.get("thumbnail_url", ch.thumbnail_url)
        ch.subscriber_count = yt_data.get("subscriber_count", ch.subscriber_count)
        ch.view_count = yt_data.get("view_count", ch.view_count)
        ch.video_count = yt_data.get("video_count", ch.video_count)
        ch.stats_synced_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ch)
    except Exception as exc:
        raise HTTPException(502, f"YouTube API error: {exc}")

    return ch


@router.post("/{channel_id}/sync-videos")
def sync_videos(
    channel_id: int,
    max_results: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Fetch and store latest videos for a channel."""
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    try:
        videos_data = youtube_service.get_channel_videos(ch.youtube_channel_id, max_results=max_results)
    except Exception as exc:
        raise HTTPException(502, f"YouTube API error: {exc}")

    new_count = 0
    for v in videos_data:
        existing = db.query(Video).filter(Video.youtube_video_id == v["youtube_video_id"]).first()
        if existing:
            # Update stats
            existing.view_count = v.get("view_count", existing.view_count)
            existing.like_count = v.get("like_count", existing.like_count)
            existing.comment_count = v.get("comment_count", existing.comment_count)
        else:
            video = Video(channel_id=ch.id, **v)
            db.add(video)
            new_count += 1

    db.commit()
    return {"synced": len(videos_data), "new": new_count, "channel_id": channel_id}


@router.get("/{channel_id}/videos")
def list_videos(
    channel_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    ch = db.query(Channel).filter(Channel.id == channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    videos = (
        db.query(Video)
        .filter(Video.channel_id == channel_id)
        .order_by(Video.view_count.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": v.id,
            "youtube_video_id": v.youtube_video_id,
            "title": v.title,
            "thumbnail_url": v.thumbnail_url,
            "view_count": v.view_count,
            "like_count": v.like_count,
            "comment_count": v.comment_count,
            "duration_seconds": v.duration_seconds,
            "published_at": v.published_at,
        }
        for v in videos
    ]
