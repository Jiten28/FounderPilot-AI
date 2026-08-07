"""
SQLite engine + session factory. Called once at app startup (main.py) to
create tables if they don't exist yet — zero manual migration needed for a
hackathon timeline.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.db_models import Base

# check_same_thread=False is required for SQLite + FastAPI's threaded request
# handling; safe here because SQLAlchemy's session-per-request pattern below
# ensures no session is shared across threads simultaneously.
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a session, always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()