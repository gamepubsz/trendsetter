from __future__ import annotations

import logging
import re
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_SUBREDDIT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_]{1,20}$")

_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def normalize_subreddit(name: str) -> str:
    raw = name.strip().removeprefix("r/").removeprefix("/")
    if not _SUBREDDIT_RE.match(raw):
        raise ValueError("Invalid subreddit name.")
    return raw


def fetch_reddit_hot(
    *,
    client_id: str,
    client_secret: str,
    user_agent: str,
    subreddit: str,
    limit: int,
    cache_ttl_seconds: int,
) -> dict[str, Any]:
    """Application-only OAuth against Reddit; returns public hot listing metadata."""
    sub = normalize_subreddit(subreddit)
    lim = max(1, min(limit, 25))
    cache_key = f"{sub}:{lim}"
    now = time.monotonic()
    hit = _cache.get(cache_key)
    if hit and now - hit[0] < cache_ttl_seconds:
        return hit[1]

    token_url = "https://www.reddit.com/api/v1/access_token"
    api_root = "https://oauth.reddit.com"

    headers = {"User-Agent": user_agent}
    data = {"grant_type": "client_credentials"}

    try:
        with httpx.Client(timeout=15.0) as client:
            tok = client.post(
                token_url,
                data=data,
                headers=headers,
                auth=(client_id, client_secret),
            )
            tok.raise_for_status()
            access = tok.json().get("access_token")
            if not access:
                raise RuntimeError("Reddit token response missing access_token.")

            listing = client.get(
                f"{api_root}/r/{sub}/hot",
                params={"limit": lim, "raw_json": 1},
                headers={**headers, "Authorization": f"bearer {access}"},
            )
            listing.raise_for_status()
            payload = listing.json()
    except httpx.HTTPError:
        logger.exception("Reddit HTTP request failed.")
        raise

    items: list[dict[str, Any]] = []
    for child in payload.get("data", {}).get("children", []):
        d = child.get("data") or {}
        title = d.get("title")
        if not title:
            continue
        permalink = d.get("permalink") or ""
        url = f"https://www.reddit.com{permalink}" if permalink.startswith("/") else permalink
        items.append(
            {
                "id": d.get("id", ""),
                "title": title,
                "score": d.get("score"),
                "subreddit": d.get("subreddit"),
                "url": url,
            }
        )

    out = {
        "configured": True,
        "source": "reddit",
        "subreddit": sub,
        "items": items,
        "cache_ttl_seconds": cache_ttl_seconds,
    }
    _cache[cache_key] = (now, out)
    return out
