from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

DATABASE_URL = settings.database_url
IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def add_missing_columns():
    """create_all() never changes existing tables, so a database made by the first
    version of the app would miss the new columns. Add them here (safe to run every start)."""
    insp = inspect(engine)
    existing_tables = set(insp.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            have = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in have:
                    continue
                col_type = col.type.compile(dialect=engine.dialect)
                default = ""
                if col.default is not None and getattr(col.default, "is_scalar", False):
                    value = col.default.arg
                    if isinstance(value, bool):
                        default = f" DEFAULT {int(value)}" if IS_SQLITE else f" DEFAULT {'TRUE' if value else 'FALSE'}"
                    elif isinstance(value, (int, float)):
                        default = f" DEFAULT {value}"
                    elif isinstance(value, str):
                        default = f" DEFAULT '{value}'"
                conn.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type}{default}"))
                print(f"Database: added column {table.name}.{col.name}")
