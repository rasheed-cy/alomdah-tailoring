"""اتصال قاعدة البيانات — oracledb مباشرة + SQLAlchemy ORM."""
import oracledb
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DB_USER, DB_PASSWORD, DB_DSN


def _creator():
    """ينشئ اتصال oracledb مباشرة — يتجاوز مشاكل SQLAlchemy."""
    return oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        dsn=DB_DSN,
    )


engine = create_engine(
    "oracle+oracledb://",
    creator=_creator,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()