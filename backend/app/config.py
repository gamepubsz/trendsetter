from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_client_id: str = ""
    google_client_secret: str = ""
    oauth_redirect_uri: str = "http://localhost:8000/v1/auth/youtube/callback"
    frontend_base_url: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "http://localhost:3000"

    # Comma-separated Google OAuth scope URLs (must match consent screen).
    youtube_scopes: str = (
        "https://www.googleapis.com/auth/youtube.readonly,"
        "https://www.googleapis.com/auth/youtube.upload,"
        "https://www.googleapis.com/auth/youtube.force-ssl"
    )

    # Reddit application-only (client credentials) — public listings.
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "trendsetter:local:v0.1 (by /u/example)"
    reddit_default_subreddit: str = "videos"
    trends_cache_ttl_seconds: int = 90

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def youtube_scopes_list(self) -> list[str]:
        parts = [s.strip() for s in self.youtube_scopes.split(",") if s.strip()]
        return parts or ["https://www.googleapis.com/auth/youtube.readonly"]

    def oauth_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    def reddit_configured(self) -> bool:
        return bool(self.reddit_client_id and self.reddit_client_secret and self.reddit_user_agent)


settings = Settings()
