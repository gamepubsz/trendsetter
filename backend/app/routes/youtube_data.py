from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import YouTubeCredential
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/youtube", tags=["youtube"])

FULL_MANAGE_SCOPE = "https://www.googleapis.com/auth/youtube"


def _load_credentials(db: Session) -> tuple[Credentials, YouTubeCredential] | None:
    row = db.query(YouTubeCredential).order_by(YouTubeCredential.id.desc()).first()
    if row is None:
        return None
    creds = Credentials(
        token=None,
        refresh_token=row.refresh_token,
        token_uri=row.token_uri,
        client_id=row.client_id,
        client_secret=row.client_secret,
        scopes=row.scopes.split(),
    )
    return creds, row


def _scopes_list(row: YouTubeCredential) -> list[str]:
    return [s for s in row.scopes.split() if s]


def _can_edit_snippet(row: YouTubeCredential) -> bool:
    scopes = set(_scopes_list(row))
    return FULL_MANAGE_SCOPE in scopes or (
        "https://www.googleapis.com/auth/youtube.force-ssl" in scopes
    )


class VideoSnippetPatch(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    tags: list[str] | None = Field(default=None, max_length=30)


@router.get("/status")
def connection_status(db: Session = Depends(get_db)) -> dict[str, object]:
    row = db.query(YouTubeCredential).order_by(YouTubeCredential.id.desc()).first()
    if row is None:
        return {"connected": False, "scopes": []}
    return {"connected": True, "scopes": _scopes_list(row)}


@router.get("/channels")
def list_my_channels(db: Session = Depends(get_db)) -> dict[str, list[dict[str, str]]]:
    loaded = _load_credentials(db)
    if loaded is None:
        raise HTTPException(status_code=401, detail="YouTube is not connected.")
    creds, _row = loaded
    try:
        creds.refresh(Request())
    except Exception:
        logger.exception("Failed to refresh credentials.")
        raise HTTPException(status_code=401, detail="Stored credentials are invalid. Re-connect YouTube.")

    try:
        yt = build("youtube", "v3", credentials=creds, cache_discovery=False)
        resp = yt.channels().list(part="snippet,contentDetails", mine=True).execute()
    except HttpError as e:
        logger.warning("YouTube API error: %s", e.resp.status)
        raise HTTPException(status_code=502, detail="YouTube API request failed.") from e

    items = []
    for it in resp.get("items", []):
        sid = it.get("id", "")
        title = (it.get("snippet") or {}).get("title") or ""
        items.append({"id": sid, "title": title})
    return {"channels": items}


@router.patch("/videos/{video_id}")
def patch_video_snippet(
    video_id: str,
    body: VideoSnippetPatch,
    db: Session = Depends(get_db),
) -> dict[str, str | bool]:
    """Update title/description/tags for a video you own (requires force-ssl or full YouTube scope)."""
    loaded = _load_credentials(db)
    if loaded is None:
        raise HTTPException(status_code=401, detail="YouTube is not connected.")
    creds, row = loaded
    if not _can_edit_snippet(row):
        raise HTTPException(
            status_code=403,
            detail="Missing youtube.force-ssl (or full youtube) scope. Re-connect after updating the consent screen.",
        )

    if body.title is None and body.description is None and body.tags is None:
        raise HTTPException(status_code=400, detail="Provide at least one of title, description, tags.")

    try:
        creds.refresh(Request())
    except Exception:
        logger.exception("Failed to refresh credentials.")
        raise HTTPException(status_code=401, detail="Stored credentials are invalid. Re-connect YouTube.")

    try:
        yt = build("youtube", "v3", credentials=creds, cache_discovery=False)
        existing = yt.videos().list(part="snippet", id=video_id).execute()
        items = existing.get("items") or []
        if not items:
            raise HTTPException(status_code=404, detail="Video not found or not accessible.")
        snippet = dict(items[0].get("snippet") or {})

        if body.title is not None:
            snippet["title"] = body.title
        if body.description is not None:
            snippet["description"] = body.description
        if body.tags is not None:
            snippet["tags"] = body.tags[:30]

        yt.videos().update(part="snippet", body={"id": video_id, "snippet": snippet}).execute()
    except HttpError as e:
        logger.warning("YouTube API error on update: %s", e.resp.status)
        raise HTTPException(status_code=502, detail="YouTube API update failed.") from e

    return {"ok": True, "id": video_id}
