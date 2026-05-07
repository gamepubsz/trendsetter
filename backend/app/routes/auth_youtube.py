from __future__ import annotations

import logging
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import OAuthState, YouTubeCredential
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth/youtube", tags=["auth"])

YOUTUBE_READONLY = "https://www.googleapis.com/auth/youtube.readonly"


def _client_config() -> dict:
    return {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.oauth_redirect_uri],
        }
    }


def _purge_expired_states(db: Session) -> None:
    cutoff = datetime.now(UTC) - timedelta(minutes=15)
    db.query(OAuthState).filter(OAuthState.created_at < cutoff).delete()
    db.commit()


@router.get("/start")
def start_oauth(db: Session = Depends(get_db)) -> RedirectResponse:
    if not settings.oauth_configured():
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )
    _purge_expired_states(db)
    state = secrets.token_urlsafe(32)
    db.add(OAuthState(state=state))
    db.commit()

    flow = Flow.from_client_config(
        _client_config(),
        scopes=[YOUTUBE_READONLY],
        redirect_uri=settings.oauth_redirect_uri,
    )
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return RedirectResponse(url=authorization_url, status_code=302)


@router.get("/callback")
def oauth_callback(
    db: Session = Depends(get_db),
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
) -> RedirectResponse:
    if error:
        logger.warning("OAuth error from provider (no secrets logged).")
        return RedirectResponse(
            url=f"{settings.frontend_base_url}/en/dashboard?youtube=error",
            status_code=302,
        )
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state.")
    if not settings.oauth_configured():
        raise HTTPException(status_code=503, detail="OAuth not configured.")

    row = db.query(OAuthState).filter(OAuthState.state == state).one_or_none()
    if row is None:
        raise HTTPException(status_code=400, detail="Invalid or expired state.")

    db.delete(row)
    db.commit()

    flow = Flow.from_client_config(
        _client_config(),
        scopes=[YOUTUBE_READONLY],
        redirect_uri=settings.oauth_redirect_uri,
    )
    try:
        flow.fetch_token(code=code)
    except Exception:
        logger.exception("Token exchange failed.")
        return RedirectResponse(
            url=f"{settings.frontend_base_url}/en/dashboard?youtube=error",
            status_code=302,
        )

    creds = flow.credentials
    if not creds.refresh_token:
        logger.error("No refresh_token returned; revoke app access in Google account and retry with prompt=consent.")
        return RedirectResponse(
            url=f"{settings.frontend_base_url}/en/dashboard?youtube=no_refresh",
            status_code=302,
        )

    db.query(YouTubeCredential).delete()
    payload = YouTubeCredential(
        refresh_token=creds.refresh_token,
        token_uri=creds.token_uri or "https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=" ".join(creds.scopes or [YOUTUBE_READONLY]),
    )
    db.add(payload)
    db.commit()

    return RedirectResponse(
        url=f"{settings.frontend_base_url}/en/dashboard?youtube=connected",
        status_code=302,
    )
