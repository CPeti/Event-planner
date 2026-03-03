from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class PlanBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    created_by: str | None = None


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class PlanRead(PlanBase):
    id: int
    share_token: str  # Always set when returned (backfilled if was null)
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ParticipantBase(BaseModel):
    name: str


class ParticipantCreate(ParticipantBase):
    plan_id: int


class ParticipantUpdate(BaseModel):
    name: str | None = None


class ParticipantRead(ParticipantBase):
    id: int
    plan_id: int

    model_config = ConfigDict(from_attributes=True)


from typing import Literal

class AvailabilityBase(BaseModel):
    plan_id: int
    participant_id: int
    date: date
    status: Literal["yes", "maybe", "no"] = "yes"


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityRead(AvailabilityBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class AvailabilityToggle(BaseModel):
    """Set availability for one participant on one date. Sparse: only send when available."""
    participant_id: int
    date: date
    status: Literal["yes", "maybe", "no", "unknown"]


class AvailabilityBatchResult(BaseModel):
    updated_count: int
    deleted_count: int


class GridSummary(BaseModel):
    """Per-date count of available participants based on categorical status."""
    date: date
    yes_count: int
    maybe_count: int
    no_count: int


class PlanGrid(BaseModel):
    """Full grid data for a plan: participants, dates range, availabilities (sparse), summary per date."""
    plan: PlanRead
    participants: list[ParticipantRead]
    start_date: date
    end_date: date
    availabilities: list[AvailabilityRead]
    summary_by_date: list[GridSummary]
