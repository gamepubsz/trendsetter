from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.db import models

# Ensure SQLite directory exists when using file-based URL.
if settings.database_url.startswith("sqlite"):
    url = make_url(settings.database_url)
    if url.database:
        parent = os.path.dirname(os.path.abspath(url.database))
        if parent:
            os.makedirs(parent, exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _migrate_oauth_state_locale() -> None:
    """Add oauth_states.locale for databases created before this column existed."""
    insp = inspect(engine)
    if "oauth_states" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("oauth_states")}
    if "locale" in cols:
        return
    if engine.dialect.name == "sqlite":
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE oauth_states ADD COLUMN locale VARCHAR(8) DEFAULT 'en'")
            )
            conn.execute(text("UPDATE oauth_states SET locale='en' WHERE locale IS NULL"))


def init_db() -> None:
    models.Base.metadata.create_all(bind=engine)
    _migrate_oauth_state_locale()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
