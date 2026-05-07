from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AICache(Base):
    """Caches AI responses keyed by prompt hash to reduce token costs."""
    __tablename__ = "ai_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prompt_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    prompt_text: Mapped[str] = mapped_column(Text)
    response_text: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(64))
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    task_type: Mapped[str | None] = mapped_column(String(64), nullable=True)  # title | script | tags | analysis
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    hit_count: Mapped[int] = mapped_column(Integer, default=0)    # how many times cache was reused
