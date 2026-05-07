"""YouTube Data API v3 integration service."""
import json
import logging
from datetime import datetime, timezone
from typing import Any

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import get_settings

logger = logging.getLogger(__name__)


def _build_client():
    settings = get_settings()
    if not settings.youtube_api_key:
        raise ValueError("YOUTUBE_API_KEY is not configured. Add it to your .env file.")
    return build("youtube", "v3", developerKey=settings.youtube_api_key)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(HttpError),
)
def _execute(request):
    return request.execute()


# ---------------------------------------------------------------------------
# Channel info
# ---------------------------------------------------------------------------

def get_channel_by_id(channel_id: str) -> dict[str, Any] | None:
    """Fetch channel metadata by YouTube channel ID."""
    try:
        client = _build_client()
        response = _execute(
            client.channels().list(
                part="snippet,statistics,brandingSettings,contentDetails",
                id=channel_id,
            )
        )
        items = response.get("items", [])
        if not items:
            return None
        return _parse_channel(items[0])
    except HttpError as exc:
        logger.error("YouTube API error fetching channel %s: %s", channel_id, exc)
        raise


def get_channel_by_handle(handle: str) -> dict[str, Any] | None:
    """Fetch channel metadata by @handle or custom URL."""
    try:
        client = _build_client()
        # forHandle only accepted values that start with @ - strip it if present
        clean_handle = handle.lstrip("@")
        response = _execute(
            client.channels().list(
                part="snippet,statistics,brandingSettings,contentDetails",
                forHandle=clean_handle,
            )
        )
        items = response.get("items", [])
        if not items:
            return None
        return _parse_channel(items[0])
    except HttpError as exc:
        logger.error("YouTube API error fetching channel by handle %s: %s", handle, exc)
        raise


def _parse_channel(item: dict) -> dict[str, Any]:
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    return {
        "youtube_channel_id": item["id"],
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "handle": snippet.get("customUrl", ""),
        "country": snippet.get("country", ""),
        "language": snippet.get("defaultLanguage", ""),
        "thumbnail_url": (snippet.get("thumbnails", {}).get("high", {}) or {}).get("url", ""),
        "subscriber_count": int(stats.get("subscriberCount", 0)),
        "view_count": int(stats.get("viewCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
        "stats_synced_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------

def get_channel_videos(channel_id: str, max_results: int = 50) -> list[dict[str, Any]]:
    """Fetch latest videos for a channel."""
    try:
        client = _build_client()
        # First get the uploads playlist ID
        ch_resp = _execute(
            client.channels().list(part="contentDetails", id=channel_id)
        )
        items = ch_resp.get("items", [])
        if not items:
            return []
        uploads_playlist_id = (
            items[0].get("contentDetails", {})
            .get("relatedPlaylists", {})
            .get("uploads", "")
        )
        if not uploads_playlist_id:
            return []

        # Fetch playlist items
        video_ids = []
        page_token = None
        while len(video_ids) < max_results:
            params: dict[str, Any] = {
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": min(50, max_results - len(video_ids)),
            }
            if page_token:
                params["pageToken"] = page_token
            pl_resp = _execute(client.playlistItems().list(**params))
            for item in pl_resp.get("items", []):
                vid_id = item["snippet"]["resourceId"].get("videoId")
                if vid_id:
                    video_ids.append(vid_id)
            page_token = pl_resp.get("nextPageToken")
            if not page_token:
                break

        if not video_ids:
            return []

        # Batch fetch video details (max 50 per request)
        videos = []
        for i in range(0, len(video_ids), 50):
            batch = video_ids[i : i + 50]
            vid_resp = _execute(
                client.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=",".join(batch),
                )
            )
            for item in vid_resp.get("items", []):
                videos.append(_parse_video(item))

        return videos
    except HttpError as exc:
        logger.error("YouTube API error fetching videos for channel %s: %s", channel_id, exc)
        raise


def _parse_video(item: dict) -> dict[str, Any]:
    snippet = item.get("snippet", {})
    stats = item.get("statistics", {})
    content = item.get("contentDetails", {})

    # Parse ISO 8601 duration to seconds
    duration_str = content.get("duration", "PT0S")
    duration_seconds = _parse_duration(duration_str)

    published_raw = snippet.get("publishedAt", "")
    published_at = None
    if published_raw:
        try:
            published_at = datetime.fromisoformat(published_raw.replace("Z", "+00:00")).isoformat()
        except ValueError:
            pass

    return {
        "youtube_video_id": item["id"],
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "thumbnail_url": (snippet.get("thumbnails", {}).get("high", {}) or {}).get("url", ""),
        "tags": json.dumps(snippet.get("tags", [])),
        "category_id": snippet.get("categoryId", ""),
        "duration_seconds": duration_seconds,
        "view_count": int(stats.get("viewCount", 0)),
        "like_count": int(stats.get("likeCount", 0)),
        "comment_count": int(stats.get("commentCount", 0)),
        "published_at": published_at,
    }


def _parse_duration(duration: str) -> int:
    """Parse ISO 8601 duration string to seconds."""
    import re
    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    match = re.match(pattern, duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


# ---------------------------------------------------------------------------
# Trending videos
# ---------------------------------------------------------------------------

def get_trending_videos(region_code: str = "US", category_id: str = "0", max_results: int = 25) -> list[dict[str, Any]]:
    """Fetch currently trending videos on YouTube."""
    try:
        client = _build_client()
        response = _execute(
            client.videos().list(
                part="snippet,statistics,contentDetails",
                chart="mostPopular",
                regionCode=region_code,
                videoCategoryId=category_id,
                maxResults=max_results,
            )
        )
        return [_parse_video(item) for item in response.get("items", [])]
    except HttpError as exc:
        logger.error("YouTube API error fetching trending videos: %s", exc)
        raise


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def search_videos(query: str, max_results: int = 20, order: str = "relevance") -> list[dict[str, Any]]:
    """Search YouTube videos by keyword."""
    try:
        client = _build_client()
        response = _execute(
            client.search().list(
                part="snippet",
                q=query,
                type="video",
                maxResults=max_results,
                order=order,
            )
        )
        results = []
        for item in response.get("items", []):
            snippet = item.get("snippet", {})
            results.append({
                "youtube_video_id": item["id"]["videoId"],
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "thumbnail_url": (snippet.get("thumbnails", {}).get("high", {}) or {}).get("url", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "channel_id": snippet.get("channelId", ""),
                "published_at": snippet.get("publishedAt", ""),
            })
        return results
    except HttpError as exc:
        logger.error("YouTube API error searching videos: %s", exc)
        raise
