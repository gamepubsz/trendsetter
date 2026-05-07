"""Settings management endpoints (read config, validate API keys)."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings
from app.utils.security import mask_api_key

router = APIRouter(prefix="/settings", tags=["settings"])


class APIKeyStatus(BaseModel):
    youtube: bool
    openai: bool
    reddit: bool


@router.get("/status")
def get_status():
    """Return which API keys are configured (values masked)."""
    settings = get_settings()
    return {
        "youtube_api_key": {
            "configured": bool(settings.youtube_api_key),
            "masked": mask_api_key(settings.youtube_api_key) if settings.youtube_api_key else None,
        },
        "openai_api_key": {
            "configured": bool(settings.openai_api_key),
            "masked": mask_api_key(settings.openai_api_key) if settings.openai_api_key else None,
            "default_model": settings.openai_default_model,
            "advanced_model": settings.openai_advanced_model,
            "daily_token_budget": settings.openai_daily_token_budget,
        },
        "reddit": {
            "configured": bool(settings.reddit_client_id and settings.reddit_client_secret),
        },
        "app_env": settings.app_env,
    }


@router.post("/validate/youtube")
async def validate_youtube_key():
    """Test if YouTube API key is working."""
    settings = get_settings()
    if not settings.youtube_api_key:
        raise HTTPException(400, "YOUTUBE_API_KEY not configured")
    try:
        from app.services.youtube_service import get_trending_videos
        videos = get_trending_videos(max_results=1)
        return {"valid": True, "message": f"YouTube API working. Fetched {len(videos)} video."}
    except Exception as exc:
        raise HTTPException(502, f"YouTube API test failed: {exc}")


@router.post("/validate/openai")
async def validate_openai_key():
    """Test if OpenAI API key is working (minimal token usage)."""
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(400, "OPENAI_API_KEY not configured")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model=settings.openai_default_model,
            messages=[{"role": "user", "content": "Say 'ok' in one word."}],
            max_tokens=5,
        )
        return {
            "valid": True,
            "model": settings.openai_default_model,
            "response": resp.choices[0].message.content,
        }
    except Exception as exc:
        raise HTTPException(502, f"OpenAI API test failed: {exc}")
