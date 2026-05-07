from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TokenUsage(Base):
    """Daily token usage tracking per model and task type."""
    __tablename__ = "token_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    usage_date: Mapped[date] = mapped_column(Date, index=True, default=date.today)
    model: Mapped[str] = mapped_column(String(64))
    task_type: Mapped[str] = mapped_column(String(64))  # title | script | tags | analysis | trend_summary
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    cache_hits: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
