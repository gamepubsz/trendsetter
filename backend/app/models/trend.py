from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Trend(Base):
    __tablename__ = "trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source: Mapped[str] = mapped_column(String(32), index=True)   # youtube | google | reddit | twitter
    keyword: Mapped[str] = mapped_column(String(256), index=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)   # engagement / popularity score
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    region: Mapped[str] = mapped_column(String(8), default="US")
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON blob for extra fields

    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
