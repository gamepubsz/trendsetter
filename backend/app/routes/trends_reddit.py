from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.services import reddit_trends

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/trends", tags=["trends"])


@router.get("/reddit")
def reddit_hot(
    subreddit: str | None = Query(
        default=None,
        description="Subreddit name without r/; defaults to REDDIT_DEFAULT_SUBREDDIT.",
    ),
    limit: int = Query(default=10, ge=1, le=25),
) -> dict:
    if not settings.reddit_configured():
        return {
            "configured": False,
            "source": "reddit",
            "subreddit": subreddit or settings.reddit_default_subreddit,
            "items": [],
        }

    sub = subreddit or settings.reddit_default_subreddit
    try:
        return reddit_trends.fetch_reddit_hot(
            client_id=settings.reddit_client_id,
            client_secret=settings.reddit_client_secret,
            user_agent=settings.reddit_user_agent,
            subreddit=sub,
            limit=limit,
            cache_ttl_seconds=settings.trends_cache_ttl_seconds,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.warning("Reddit trend fetch failed.")
        raise HTTPException(status_code=502, detail="Reddit API request failed.") from e
