"""AI-powered content generation endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content_idea import ContentIdea
from app.models.channel import Channel
from app.services import ai_service
from app.utils.security import sanitize_text

router = APIRouter(prefix="/content", tags=["content"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TitleRequest(BaseModel):
    topic: str
    channel_style: str = ""
    count: int = 5

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, v):
        return sanitize_text(v, max_length=500)


class TagsRequest(BaseModel):
    title: str
    description: str = ""


class DescriptionRequest(BaseModel):
    title: str
    outline: str = ""


class OutlineRequest(BaseModel):
    topic: str
    duration_minutes: int = 10


class ScriptRequest(BaseModel):
    topic: str
    outline: str
    duration_minutes: int = 10


class IdeaCreate(BaseModel):
    channel_id: int | None = None
    title: str
    hook: str | None = None
    script_outline: str | None = None
    full_script: str | None = None
    tags: str | None = None
    description: str | None = None
    target_keyword: str | None = None
    source_trend: str | None = None
    notes: str | None = None


class IdeaUpdate(BaseModel):
    title: str | None = None
    hook: str | None = None
    script_outline: str | None = None
    full_script: str | None = None
    tags: str | None = None
    description: str | None = None
    status: str | None = None
    is_starred: bool | None = None
    notes: str | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed = {"idea", "scripted", "filmed", "published"}
        if v and v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class TrendIdeaRequest(BaseModel):
    channel_id: int
    region: str = "US"


# ---------------------------------------------------------------------------
# AI Generation endpoints
# ---------------------------------------------------------------------------

@router.post("/generate/titles")
def generate_titles(payload: TitleRequest, db: Session = Depends(get_db)):
    try:
        result = ai_service.generate_video_titles(
            db,
            topic=payload.topic,
            channel_style=payload.channel_style,
            count=payload.count,
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/generate/tags")
def generate_tags(payload: TagsRequest, db: Session = Depends(get_db)):
    try:
        result = ai_service.generate_video_tags(db, title=payload.title, description=payload.description)
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))


@router.post("/generate/description")
def generate_description(payload: DescriptionRequest, db: Session = Depends(get_db)):
    try:
        result = ai_service.generate_video_description(db, title=payload.title, outline=payload.outline)
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))


@router.post("/generate/outline")
def generate_outline(payload: OutlineRequest, db: Session = Depends(get_db)):
    try:
        result = ai_service.generate_script_outline(
            db, topic=sanitize_text(payload.topic), duration_minutes=payload.duration_minutes
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))


@router.post("/generate/script")
def generate_script(payload: ScriptRequest, db: Session = Depends(get_db)):
    """Generate a full script (uses advanced model, higher token cost)."""
    try:
        result = ai_service.generate_full_script(
            db,
            topic=sanitize_text(payload.topic),
            outline=sanitize_text(payload.outline, max_length=5000),
            duration_minutes=payload.duration_minutes,
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))


@router.post("/generate/trend-ideas")
def generate_trend_ideas(payload: TrendIdeaRequest, db: Session = Depends(get_db)):
    """Generate content ideas based on current trends for a specific channel."""
    from app.models.trend import Trend
    from datetime import timezone, timedelta
    from datetime import datetime

    ch = db.query(Channel).filter(Channel.id == payload.channel_id).first()
    if not ch:
        raise HTTPException(404, "Channel not found")

    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    trends = (
        db.query(Trend)
        .filter(Trend.fetched_at >= cutoff)
        .order_by(Trend.score.desc())
        .limit(30)
        .all()
    )
    trend_list = [
        {"keyword": t.keyword, "source": t.source, "score": t.score or 0}
        for t in trends
    ]

    try:
        result = ai_service.suggest_content_from_trends(
            db,
            channel_title=ch.title,
            channel_category=ch.category or "general",
            trends=trend_list,
        )
        return result
    except RuntimeError as exc:
        raise HTTPException(429, str(exc))


# ---------------------------------------------------------------------------
# Content ideas CRUD
# ---------------------------------------------------------------------------

@router.get("/ideas")
def list_ideas(
    channel_id: int | None = Query(None),
    status: str | None = Query(None),
    starred: bool | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(ContentIdea)
    if channel_id is not None:
        q = q.filter(ContentIdea.channel_id == channel_id)
    if status:
        q = q.filter(ContentIdea.status == status)
    if starred is not None:
        q = q.filter(ContentIdea.is_starred == starred)
    ideas = q.order_by(ContentIdea.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": i.id,
            "channel_id": i.channel_id,
            "title": i.title,
            "hook": i.hook,
            "status": i.status,
            "is_starred": i.is_starred,
            "target_keyword": i.target_keyword,
            "trend_score": i.trend_score,
            "source_trend": i.source_trend,
            "has_script": bool(i.full_script),
            "created_at": i.created_at.isoformat(),
        }
        for i in ideas
    ]


@router.post("/ideas", status_code=201)
def create_idea(payload: IdeaCreate, db: Session = Depends(get_db)):
    idea = ContentIdea(
        channel_id=payload.channel_id,
        title=sanitize_text(payload.title, 512),
        hook=sanitize_text(payload.hook or ""),
        script_outline=sanitize_text(payload.script_outline or "", 10000),
        full_script=sanitize_text(payload.full_script or "", 50000),
        tags=payload.tags,
        description=sanitize_text(payload.description or "", 5000),
        target_keyword=sanitize_text(payload.target_keyword or "", 256),
        source_trend=sanitize_text(payload.source_trend or "", 512),
        notes=sanitize_text(payload.notes or "", 2000),
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return {"id": idea.id, "title": idea.title, "status": idea.status}


@router.get("/ideas/{idea_id}")
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(404, "Content idea not found")
    return {
        "id": idea.id,
        "channel_id": idea.channel_id,
        "title": idea.title,
        "hook": idea.hook,
        "script_outline": idea.script_outline,
        "full_script": idea.full_script,
        "tags": idea.tags,
        "description": idea.description,
        "target_keyword": idea.target_keyword,
        "source_trend": idea.source_trend,
        "status": idea.status,
        "is_starred": idea.is_starred,
        "notes": idea.notes,
        "created_at": idea.created_at.isoformat(),
        "updated_at": idea.updated_at.isoformat(),
    }


@router.patch("/ideas/{idea_id}")
def update_idea(idea_id: int, payload: IdeaUpdate, db: Session = Depends(get_db)):
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(404, "Content idea not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(idea, field, value)
    db.commit()
    db.refresh(idea)
    return {"id": idea.id, "title": idea.title, "status": idea.status}


@router.delete("/ideas/{idea_id}", status_code=204)
def delete_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.query(ContentIdea).filter(ContentIdea.id == idea_id).first()
    if not idea:
        raise HTTPException(404, "Content idea not found")
    db.delete(idea)
    db.commit()
