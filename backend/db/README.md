# Database Layer

This document covers the full workflow for adding a new resource to the backend: model, schema, migration, session, router, and manual testing.

---

## Directory Structure

```
db/
├── base.py          # SQLAlchemy declarative base
├── session.py       # Engine, session factory, and FastAPI dependency
├── models/
│   └── users.py     # ORM models (one file per resource)
└── schemas/
    └── users.py     # Pydantic schemas (one file per resource)

alembic/
├── env.py           # Alembic runtime config (loads .env, sets target_metadata)
├── versions/        # Auto-generated migration files
└── script.py.mako   # Migration file template

routers/
└── users.py         # FastAPI router with CRUD endpoints
```

---

## Step 1 — Define the ORM Model

Create `db/models/<resource>.py`. Import `Base` from `db.base` and define the table using SQLAlchemy 2.0 mapped columns.

```python
# db/models/listings.py
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
```

**Column type reference:**

| Python type | SQLAlchemy type |
|---|---|
| `str` | `String` or `Text` |
| `int` | `Integer` |
| `bool` | `Boolean` |
| `float` | `Float` |
| `datetime` | `DateTime(timezone=True)` |
| `uuid.UUID` | `UUID(as_uuid=True)` (PostgreSQL) |
| foreign key | `ForeignKey("table.column")` |

---

## Step 2 — Define the Pydantic Schemas

Create `db/schemas/<resource>.py`. Schemas control what data comes in (request) and goes out (response). Keep them separate from the ORM model.

```python
# db/schemas/listings.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class ListingBase(BaseModel):
    title: str
    description: str | None = None
    is_active: bool = True


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_active: bool | None = None


class Listing(ListingBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
```

**Schema pattern:**

- `Base` — shared fields used in both create and response
- `Create` — inherits Base, used as the POST request body
- `Update` — all fields optional, used as the PATCH request body
- `<Resource>` — full response schema, includes `id`, timestamps, etc. Must set `model_config = {"from_attributes": True}` to work with ORM objects

---

## Step 3 — Register the Model with Alembic

Open `alembic/env.py` and add an import for the new model so it gets registered with `Base.metadata` before autogenerate runs:

```python
# alembic/env.py
import db.models.users   # already present
import db.models.listings  # add new model here
```

This is required — Alembic discovers tables through `Base.metadata`, which is only populated when the model module is imported.

---

## Step 4 — Generate and Apply the Migration

```bash
# Generate migration file from model changes
alembic revision --autogenerate -m "create listings table"

# Review the generated file in alembic/versions/
# Then apply it
alembic upgrade head
```

**Other useful Alembic commands:**

```bash
# Check current migration state
alembic current

# View migration history
alembic history

# Rollback one migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base
```

---

## Step 5 — Create the Router

Create `routers/<resource>.py`. Use `Depends(get_db)` to inject the database session.

```python
# routers/listings.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.models.listings import Listing
from db.schemas.listings import Listing as ListingSchema
from db.schemas.listings import ListingCreate, ListingUpdate
from db.session import get_db

router = APIRouter(prefix="/listings", tags=["listings"])


@router.post("/", response_model=ListingSchema, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db)):
    listing = Listing(**payload.model_dump())
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/{listing_id}", response_model=ListingSchema)
def get_listing(listing_id: uuid.UUID, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.patch("/{listing_id}", response_model=ListingSchema)
def update_listing(listing_id: uuid.UUID, payload: ListingUpdate, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: uuid.UUID, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.delete(listing)
    db.commit()
```

---

## Step 6 — Register the Router in main.py

```python
# main.py
from fastapi import FastAPI
from routers import users, listings

app = FastAPI()

app.include_router(users.router)
app.include_router(listings.router)
```

---

## Step 7 — Test the Endpoints

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

**Create:**
```bash
curl -s -X POST http://localhost:8000/listings/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Cozy Room in Berkeley", "description": "Near campus, utilities included"}'
```

**Read:**
```bash
curl -s http://localhost:8000/listings/<id>
```

**Update:**
```bash
curl -s -X PATCH http://localhost:8000/listings/<id> \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**Delete:**
```bash
curl -s -X DELETE http://localhost:8000/listings/<id>
# Returns 204 No Content
```

Interactive docs are also available at `http://localhost:8000/docs`.

---

## How the Database Session Works

`db/session.py` creates a single `engine` from `DATABASE_URL` and a `SessionLocal` factory. The `get_db` function is a FastAPI dependency that opens a session per request and closes it when the response is sent — even if an exception occurs.

```python
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Inject it in any route with `db: Session = Depends(get_db)`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Public-facing PostgreSQL connection string (used locally and in CI) |
| `DATABASE_INTERNAL_URL` | Railway internal hostname (only reachable from within Railway's network) |

Both are stored in `.env` (gitignored). When deploying to Railway, set `DATABASE_URL` to the internal URL for lower latency within the same private network.
