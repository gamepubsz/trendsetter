"""Security utilities: input validation, sanitization, and API key masking."""
import re
import html
from typing import Any


_DANGEROUS_PATTERNS = re.compile(
    r"(<script|javascript:|data:|vbscript:|on\w+=)", re.IGNORECASE
)


def sanitize_text(value: str, max_length: int = 2000) -> str:
    """Strip HTML/script injection and enforce max length."""
    if not value:
        return ""
    cleaned = html.escape(value, quote=True)
    if _DANGEROUS_PATTERNS.search(cleaned):
        raise ValueError("Input contains disallowed content.")
    return cleaned[:max_length]


def mask_api_key(key: str) -> str:
    """Return a masked version for display (e.g. 'sk-...abc123')."""
    if not key or len(key) < 8:
        return "***"
    return key[:4] + "..." + key[-6:]


def is_valid_youtube_channel_id(channel_id: str) -> bool:
    """YouTube channel IDs are 24 chars starting with UC."""
    return bool(re.match(r"^UC[a-zA-Z0-9_-]{22}$", channel_id))


def is_valid_youtube_video_id(video_id: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9_-]{11}$", video_id))


def clean_dict(data: dict[str, Any]) -> dict[str, Any]:
    """Recursively strip None values and sanitize string fields."""
    result = {}
    for k, v in data.items():
        if v is None:
            continue
        if isinstance(v, str):
            result[k] = sanitize_text(v)
        elif isinstance(v, dict):
            result[k] = clean_dict(v)
        else:
            result[k] = v
    return result
