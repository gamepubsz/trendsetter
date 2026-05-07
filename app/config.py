from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Trendsetter YouTube Copilot"
    environment: str = "dev"
    daily_token_budget: int = 120_000
    per_request_token_cap: int = 6_000
    cache_ttl_seconds: int = 1_800
    default_language: str = "en-US"
    default_trend_source: str = "youtube"
    default_monetization_priorities: str = "ads,affiliate"

    model_config = SettingsConfigDict(env_prefix="TRENDSETTER_", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
