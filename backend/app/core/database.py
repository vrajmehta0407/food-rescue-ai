import uuid
from typing import Generator
from sqlalchemy import create_engine, String, TypeDecorator, JSON as SqlAlchemyJSON
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Determine database dialect
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL UUID type on Postgres, CHAR(36) on SQLite.
    """
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        val_str = str(value).strip()
        if not val_str or val_str.lower() == "none":
            return None
        try:
            return str(uuid.UUID(val_str))
        except (ValueError, AttributeError):
            return val_str

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)


# Universal JSON type that maps cleanly across Postgres & SQLite
JSONType = SqlAlchemyJSON


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields an active database session and ensures it closes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

