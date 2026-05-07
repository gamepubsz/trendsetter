from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, DateTime, Boolean, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    youtube_channel_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    handle: Mapped[str | None] = mapped_column(String(128), nullable=True)
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    country: Mapped[str | None] = mapped_column(String(8), nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Stats (updated periodically)
    subscriber_count: Mapped[int] = mapped_column(BigInteger, default=0)
    view_count: Mapped[int] = mapped_column(BigInteger, default=0)
    video_count: Mapped[int] = mapped_column(Integer, default=0)

    # Monetization
    is_monetized: Mapped[bool] = mapped_column(Boolean, default=False)
    estimated_monthly_revenue_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Tracking
    is_own_channel: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    stats_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    videos: Mapped[list["Video"]] = relationship("Video", back_populates="channel", cascade="all, delete-orphan")
    content_ideas: Mapped[list["ContentIdea"]] = relationship("ContentIdea", back_populates="channel", cascade="all, delete-orphan")
