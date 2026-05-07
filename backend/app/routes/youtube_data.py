from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import YouTubeCredential
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/youtube", tags=["youtube"])


def _load_credentials(db: Session) -> Credentials | None:
    row = db.query(YouTubeCredential).order_by(YouTubeCredential.id.desc()).first()
    if row is None:
        return None
    return Credentials(
        token=None,
        refresh_token=row.refresh_token,
        token_uri=row.token_uri,
        client_id=row.client_id,
        client_secret=row.client_secret,
        scopes=row.scopes.split(),
    )


@router.get("/status")
def connection_status(db: Session = Depends(get_db)) -> dict[str, bool]:
    row = db.query(YouTubeCredential).order_by(YouTubeCredential.id.desc()).first()
    return {"connected": row is not None}


@router.get("/channels")
def list_my_channels(db: Session = Depends(get_db)) -> dict[str, list[dict[str, str]]]:
    creds = _load_credentials(db)
    if creds is None:
        raise HTTPException(status_code=401, detail="YouTube is not connected.")
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
