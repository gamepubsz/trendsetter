"""AI content generation service with caching and token optimization.

Design principles:
  1. Always check DB cache before calling OpenAI (hash-based dedup)
  2. Use cheaper model (gpt-4o-mini) for most tasks; reserve gpt-4o for long scripts
  3. Record every token spend to the token_usage table
  4. Enforce a configurable daily token budget
"""
import hashlib
import json
import logging
from datetime import datetime, date, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.ai_cache import AICache
from app.models.token_usage import TokenUsage

logger = logging.getLogger(__name__)

# Approximate USD cost per 1k tokens (input + output blended)
MODEL_COSTS: dict[str, float] = {
    "gpt-4o-mini": 0.000150,
    "gpt-4o": 0.002500,
    "gpt-4o-2024-11-20": 0.002500,
    "gpt-4.1-mini": 0.000400,
    "gpt-4.1": 0.002000,
}


def _get_client():
    from openai import OpenAI
    settings = get_settings()
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured. Add it to your .env file.")
    return OpenAI(api_key=settings.openai_api_key)


def _hash_prompt(prompt: str, model: str) -> str:
    return hashlib.sha256(f"{model}:{prompt}".encode()).hexdigest()


def _check_daily_budget(db: Session) -> bool:
    """Returns True if still within daily token budget."""
    settings = get_settings()
    if settings.openai_daily_token_budget <= 0:
        return True

    today = date.today()
    rows = db.query(TokenUsage).filter(TokenUsage.usage_date == today).all()
    total_used = sum(r.total_tokens for r in rows)
    return total_used < settings.openai_daily_token_budget


def _record_usage(
    db: Session,
    model: str,
    task_type: str,
    prompt_tokens: int,
    completion_tokens: int,
    cache_hit: bool = False,
):
    cost_per_1k = MODEL_COSTS.get(model, 0.002)
    total = prompt_tokens + completion_tokens
    cost = (total / 1000) * cost_per_1k

    record = TokenUsage(
        usage_date=date.today(),
        model=model,
        task_type=task_type,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total,
        estimated_cost_usd=cost,
        cache_hits=1 if cache_hit else 0,
    )
    db.add(record)
    db.commit()


def _get_cached(db: Session, prompt_hash: str) -> str | None:
    now = datetime.now(timezone.utc)
    entry = (
        db.query(AICache)
        .filter(AICache.prompt_hash == prompt_hash, AICache.expires_at > now)
        .first()
    )
    if entry:
        entry.hit_count += 1
        db.commit()
        return entry.response_text
    return None


def _store_cache(
    db: Session,
    prompt_hash: str,
    prompt_text: str,
    response_text: str,
    model: str,
    tokens_used: int,
    task_type: str,
    ttl_seconds: int,
):
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    # Upsert
    existing = db.query(AICache).filter(AICache.prompt_hash == prompt_hash).first()
    if existing:
        existing.response_text = response_text
        existing.expires_at = expires_at
        existing.hit_count = 0
    else:
        entry = AICache(
            prompt_hash=prompt_hash,
            prompt_text=prompt_text[:2000],  # truncate for storage efficiency
            response_text=response_text,
            model=model,
            tokens_used=tokens_used,
            task_type=task_type,
            expires_at=expires_at,
        )
        db.add(entry)
    db.commit()


def call_ai(
    db: Session,
    prompt: str,
    task_type: str,
    use_advanced_model: bool = False,
    system_prompt: str = "You are a helpful YouTube content strategy expert.",
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> dict[str, Any]:
    """
    Call OpenAI with caching and budget enforcement.
    Returns {"text": str, "cached": bool, "tokens": int, "model": str}
    """
    settings = get_settings()
    model = settings.openai_advanced_model if use_advanced_model else settings.openai_default_model

    prompt_hash = _hash_prompt(prompt, model)

    # 1. Check cache
    cached = _get_cached(db, prompt_hash)
    if cached:
        logger.debug("AI cache hit for task_type=%s", task_type)
        return {"text": cached, "cached": True, "tokens": 0, "model": model}

    # 2. Check daily budget
    if not _check_daily_budget(db):
        raise RuntimeError(
            f"Daily token budget of {settings.openai_daily_token_budget:,} tokens exceeded. "
            "Adjust OPENAI_DAILY_TOKEN_BUDGET in .env or wait until tomorrow."
        )

    # 3. Call API
    client = _get_client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    text = response.choices[0].message.content or ""
    usage = response.usage
    prompt_tokens = usage.prompt_tokens if usage else 0
    completion_tokens = usage.completion_tokens if usage else 0
    total_tokens = prompt_tokens + completion_tokens

    # 4. Cache the response
    _store_cache(
        db, prompt_hash, prompt, text, model, total_tokens, task_type,
        ttl_seconds=settings.ai_cache_ttl,
    )

    # 5. Record usage
    _record_usage(db, model, task_type, prompt_tokens, completion_tokens, cache_hit=False)

    return {"text": text, "cached": False, "tokens": total_tokens, "model": model}


# ---------------------------------------------------------------------------
# High-level generation helpers
# ---------------------------------------------------------------------------

def generate_video_titles(
    db: Session,
    topic: str,
    channel_style: str = "",
    count: int = 5,
) -> dict[str, Any]:
    prompt = (
        f"Generate {count} compelling YouTube video titles for the topic: '{topic}'.\n"
        f"{'Channel style/tone: ' + channel_style if channel_style else ''}\n"
        "Rules:\n"
        "- Each title must be under 70 characters\n"
        "- Mix curiosity gaps, numbers, and strong hooks\n"
        "- Include SEO keywords naturally\n"
        "Return ONLY a JSON array of title strings, no explanation."
    )
    result = call_ai(db, prompt, task_type="title", max_tokens=512)
    try:
        titles = json.loads(result["text"])
    except (json.JSONDecodeError, ValueError):
        titles = [line.strip().lstrip("0123456789.-) ") for line in result["text"].splitlines() if line.strip()]
    return {**result, "titles": titles}


def generate_video_tags(db: Session, title: str, description: str = "") -> dict[str, Any]:
    prompt = (
        f"Generate 15 YouTube SEO tags for the following video:\n"
        f"Title: {title}\n"
        f"{'Description: ' + description[:300] if description else ''}\n"
        "Rules:\n"
        "- Mix broad and niche keywords\n"
        "- Include both short-tail and long-tail tags\n"
        "- Keep each tag under 30 characters\n"
        "Return ONLY a JSON array of tag strings."
    )
    result = call_ai(db, prompt, task_type="tags", max_tokens=256)
    try:
        tags = json.loads(result["text"])
    except (json.JSONDecodeError, ValueError):
        tags = [t.strip() for t in result["text"].split(",") if t.strip()]
    return {**result, "tags": tags}


def generate_video_description(db: Session, title: str, outline: str = "") -> dict[str, Any]:
    prompt = (
        f"Write an SEO-optimized YouTube video description for:\n"
        f"Title: {title}\n"
        f"{'Content outline: ' + outline if outline else ''}\n\n"
        "Requirements:\n"
        "- First 2-3 sentences are compelling (visible before 'Show more')\n"
        "- Include relevant keywords naturally\n"
        "- Add timestamp placeholders like 00:00 Introduction\n"
        "- End with a call-to-action (subscribe, like, comment)\n"
        "- 200-400 words total"
    )
    result = call_ai(db, prompt, task_type="description", max_tokens=700)
    return result


def generate_script_outline(db: Session, topic: str, duration_minutes: int = 10) -> dict[str, Any]:
    prompt = (
        f"Create a detailed script outline for a {duration_minutes}-minute YouTube video about: '{topic}'.\n\n"
        "Include:\n"
        "1. Hook (0:00-0:30) - attention-grabbing opening\n"
        "2. Intro (0:30-1:00) - what they'll learn\n"
        "3. Main sections with timestamps\n"
        "4. Key talking points per section\n"
        "5. Outro with CTA\n\n"
        "Return as a structured outline with clear sections."
    )
    result = call_ai(db, prompt, task_type="outline", max_tokens=1500)
    return result


def generate_full_script(db: Session, topic: str, outline: str, duration_minutes: int = 10) -> dict[str, Any]:
    prompt = (
        f"Write a full YouTube video script for a {duration_minutes}-minute video on: '{topic}'.\n\n"
        f"Outline to follow:\n{outline}\n\n"
        "Requirements:\n"
        "- Conversational, engaging tone\n"
        "- Natural speech patterns (contractions, questions to audience)\n"
        "- [B-ROLL: description] markers for visual suggestions\n"
        "- [PAUSE] markers for emphasis\n"
        "- Approximately {words} words (about 130 words/minute)".format(words=duration_minutes * 130)
    )
    result = call_ai(db, prompt, task_type="script", use_advanced_model=True, max_tokens=4000)
    return result


def analyze_channel_strategy(db: Session, channel_data: dict, top_videos: list[dict]) -> dict[str, Any]:
    prompt = (
        f"Analyze this YouTube channel and provide strategic recommendations:\n\n"
        f"Channel: {channel_data.get('title', 'Unknown')}\n"
        f"Subscribers: {channel_data.get('subscriber_count', 0):,}\n"
        f"Total Views: {channel_data.get('view_count', 0):,}\n"
        f"Video Count: {channel_data.get('video_count', 0)}\n\n"
        f"Top performing videos:\n"
        + "\n".join([f"- {v.get('title', '')} ({v.get('view_count', 0):,} views)" for v in top_videos[:5]])
        + "\n\nProvide:\n"
        "1. Content strategy analysis\n"
        "2. Top 3 growth opportunities\n"
        "3. Optimal upload frequency recommendation\n"
        "4. Monetization improvement tips\n"
        "5. Next 3 video topic suggestions based on channel theme"
    )
    result = call_ai(db, prompt, task_type="analysis", use_advanced_model=True, max_tokens=1500)
    return result


def suggest_content_from_trends(
    db: Session,
    channel_title: str,
    channel_category: str,
    trends: list[dict],
) -> dict[str, Any]:
    trend_list = "\n".join(
        [f"- {t.get('keyword', '')} (source: {t.get('source', '')}, score: {t.get('score', 0):.0f})"
         for t in trends[:15]]
    )
    prompt = (
        f"I run a YouTube channel called '{channel_title}' in the '{channel_category}' niche.\n\n"
        f"Current trending topics across social media:\n{trend_list}\n\n"
        "Based on these trends, suggest 5 video ideas that:\n"
        "1. Align with my channel niche\n"
        "2. Have high viral potential right now\n"
        "3. Can be produced quickly\n\n"
        "For each idea, provide:\n"
        "- Title\n- Hook (first 30 seconds)\n- Why it's trending now\n- Estimated view potential (Low/Medium/High)\n\n"
        "Return as a JSON array with keys: title, hook, trend_reason, view_potential"
    )
    result = call_ai(db, prompt, task_type="trend_ideas", max_tokens=1500)
    try:
        ideas = json.loads(result["text"])
    except (json.JSONDecodeError, ValueError):
        ideas = []
    return {**result, "ideas": ideas}
