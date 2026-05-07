import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _get_engine():
    settings = get_settings()
    db_url = settings.database_url

    # Ensure data directory exists for SQLite
    if db_url.startswith("sqlite"):
        db_path = db_url.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else ".", exist_ok=True)

        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Enable WAL mode for better concurrent read performance
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        return engine

    return create_engine(db_url)


engine = _get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
