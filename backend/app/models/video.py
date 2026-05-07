from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    channel_id: Mapped[int] = mapped_column(Integer, ForeignKey("channels.id"), index=True)
    youtube_video_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)

    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)       # JSON array stored as text
    category_id: Mapped[str | None] = mapped_column(String(8), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Performance metrics
    view_count: Mapped[int] = mapped_column(BigInteger, default=0)
    like_count: Mapped[int] = mapped_column(BigInteger, default=0)
    comment_count: Mapped[int] = mapped_column(BigInteger, default=0)
    avg_view_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    click_through_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_percentage_viewed: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Revenue estimate (CPM * views / 1000)
    estimated_revenue_usd: Mapped[float | None] = mapped_column(Float, nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    channel: Mapped["Channel"] = relationship("Channel", back_populates="videos")
