"""Multi-platform trend analysis service.

Sources:
  - YouTube (trending videos via YouTube Data API)
  - Google Trends (pytrends)
  - Reddit (PRAW - top posts from relevant subreddits)
"""
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Google Trends
# ---------------------------------------------------------------------------

def fetch_google_trends(keywords: list[str], region: str = "US", timeframe: str = "now 7-d") -> list[dict[str, Any]]:
    """Fetch Google Trends interest-over-time data."""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25))
        # pytrends accepts at most 5 keywords per request
        results = []
        for i in range(0, len(keywords), 5):
            batch = keywords[i : i + 5]
            pytrends.build_payload(batch, cat=0, timeframe=timeframe, geo=region)
            df = pytrends.interest_over_time()
            if df.empty:
                continue
            for kw in batch:
                if kw not in df.columns:
                    continue
                avg_score = float(df[kw].mean())
                results.append({
                    "source": "google",
                    "keyword": kw,
                    "title": f"Google Trend: {kw}",
                    "score": avg_score,
                    "region": region,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                    "raw_data": json.dumps(df[kw].tail(7).to_dict()),
                })
            time.sleep(1)  # be polite to Google
        return results
    except Exception as exc:
        logger.warning("Google Trends fetch failed: %s", exc)
        return []


def fetch_trending_searches(region: str = "US") -> list[dict[str, Any]]:
    """Fetch today's trending searches from Google Trends."""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25))
        df = pytrends.trending_searches(pn=region.lower())
        results = []
        for i, row in df.iterrows():
            keyword = row[0] if isinstance(row[0], str) else str(row[0])
            results.append({
                "source": "google",
                "keyword": keyword,
                "title": f"Trending: {keyword}",
                "score": float(len(df) - i),  # rank as score
                "region": region,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            })
        return results[:30]
    except Exception as exc:
        logger.warning("Google trending searches fetch failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Reddit
# ---------------------------------------------------------------------------

YOUTUBE_SUBREDDITS = [
    "videos", "YouTubers", "youtube", "NewTubers",
    "technology", "entertainment", "gaming", "science",
]


def fetch_reddit_trends(subreddits: list[str] | None = None, limit: int = 25) -> list[dict[str, Any]]:
    """Fetch hot posts from YouTube-relevant subreddits."""
    settings = get_settings()
    if not settings.reddit_client_id or not settings.reddit_client_secret:
        logger.info("Reddit credentials not configured - skipping Reddit trends")
        return []

    try:
        import praw
        reddit = praw.Reddit(
            client_id=settings.reddit_client_id,
            client_secret=settings.reddit_client_secret,
            user_agent=settings.reddit_user_agent,
            check_for_async=False,
        )

        target_subs = subreddits or YOUTUBE_SUBREDDITS
        results = []
        for sub_name in target_subs[:5]:  # limit API calls
            try:
                subreddit = reddit.subreddit(sub_name)
                for post in subreddit.hot(limit=limit):
                    results.append({
                        "source": "reddit",
                        "keyword": post.title[:100],
                        "title": post.title,
                        "description": post.selftext[:300] if post.selftext else "",
                        "url": f"https://reddit.com{post.permalink}",
                        "score": float(post.score),
                        "category": sub_name,
                        "region": "global",
                        "fetched_at": datetime.now(timezone.utc).isoformat(),
                        "raw_data": json.dumps({
                            "upvote_ratio": post.upvote_ratio,
                            "num_comments": post.num_comments,
                            "subreddit": sub_name,
                        }),
                    })
            except Exception as sub_exc:
                logger.warning("Failed to fetch r/%s: %s", sub_name, sub_exc)
                continue

        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:50]
    except Exception as exc:
        logger.warning("Reddit fetch failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# YouTube trending (via YouTube Data API)
# ---------------------------------------------------------------------------

def fetch_youtube_trending(region: str = "US", max_results: int = 25) -> list[dict[str, Any]]:
    """Fetch trending YouTube videos and transform to trend format."""
    try:
        from app.services.youtube_service import get_trending_videos
        videos = get_trending_videos(region_code=region, max_results=max_results)
        results = []
        for v in videos:
            results.append({
                "source": "youtube",
                "keyword": v["title"],
                "title": v["title"],
                "description": v.get("description", "")[:300],
                "url": f"https://youtube.com/watch?v={v['youtube_video_id']}",
                "score": float(v.get("view_count", 0)),
                "region": region,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "raw_data": json.dumps({
                    "video_id": v["youtube_video_id"],
                    "view_count": v.get("view_count", 0),
                    "like_count": v.get("like_count", 0),
                }),
            })
        return results
    except Exception as exc:
        logger.warning("YouTube trending fetch failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Aggregator
# ---------------------------------------------------------------------------

def fetch_all_trends(region: str = "US") -> dict[str, list[dict[str, Any]]]:
    """Fetch trends from all configured sources. Returns dict keyed by source."""
    results: dict[str, list[dict[str, Any]]] = {}

    yt_trends = fetch_youtube_trending(region=region)
    if yt_trends:
        results["youtube"] = yt_trends

    google_trends = fetch_trending_searches(region=region)
    if google_trends:
        results["google"] = google_trends

    reddit_trends = fetch_reddit_trends()
    if reddit_trends:
        results["reddit"] = reddit_trends

    return results
