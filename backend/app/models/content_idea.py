from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ContentIdea(Base):
    __tablename__ = "content_ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    channel_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("channels.id"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(String(512))
    hook: Mapped[str | None] = mapped_column(Text, nullable=True)
    script_outline: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_script: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)          # JSON array
    description: Mapped[str | None] = mapped_column(Text, nullable=True)   # SEO-optimized description
    thumbnail_concept: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_keyword: Mapped[str | None] = mapped_column(String(256), nullable=True)
    estimated_views: Mapped[int | None] = mapped_column(Integer, nullable=True)
    trend_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_trend: Mapped[str | None] = mapped_column(String(512), nullable=True)

    status: Mapped[str] = mapped_column(String(32), default="idea")  # idea | scripted | filmed | published
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    channel: Mapped["Channel"] = relationship("Channel", back_populates="content_ideas")
