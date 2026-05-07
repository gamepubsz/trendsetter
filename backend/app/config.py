from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_env: str = "development"
    app_secret_key: str = "dev-secret-key-change-in-production"
    app_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Database
    database_url: str = "sqlite:///./data/yt_manager.db"

    # YouTube
    youtube_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""
    openai_default_model: str = "gpt-4o-mini"
    openai_advanced_model: str = "gpt-4o"
    openai_daily_token_budget: int = 100_000

    # Reddit
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "YTChannelManager/1.0"

    # Cache
    cache_dir: str = "./data/cache"
    ai_cache_ttl: int = 3600
    trend_cache_ttl: int = 1800

    # Rate limiting
    rate_limit_per_minute: int = 60

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.app_cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
