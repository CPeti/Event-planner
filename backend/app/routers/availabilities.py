"""Sparse availability: we only store rows where is_available is True. Toggle = set or delete."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from ..database import get_db
from ..models import Plan, Participant, Availability
from ..schemas import AvailabilityRead, AvailabilityToggle

router = APIRouter()


@router.get("/{plan_id}/availabilities", response_model=list[AvailabilityRead])
async def list_availabilities(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Availability).where(Availability.plan_id == plan_id))
    return list(result.scalars().all())


@router.put("/{plan_id}/availabilities/toggle", response_model=AvailabilityRead | None)
async def toggle_availability(
    plan_id: int, body: AvailabilityToggle, db: AsyncSession = Depends(get_db)
):
    """Sparse: if is_available=True, upsert a row; if False, delete the row if it exists."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plan not found")
    result = await db.execute(
        select(Participant).where(
            Participant.id == body.participant_id, Participant.plan_id == plan_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Participant not found")

    if body.is_available:
        # Upsert: get or create
        r = await db.execute(
            select(Availability).where(
                Availability.plan_id == plan_id,
                Availability.participant_id == body.participant_id,
                Availability.date == body.date,
            )
        )
        existing = r.scalar_one_or_none()
        if existing:
            existing.is_available = True
            await db.flush()
            await db.refresh(existing)
            return existing
        avail = Availability(
            plan_id=plan_id,
            participant_id=body.participant_id,
            date=body.date,
            is_available=True,
        )
        db.add(avail)
        await db.flush()
        await db.refresh(avail)
        return avail
    else:
        # Sparse: remove row
        await db.execute(
            delete(Availability).where(
                Availability.plan_id == plan_id,
                Availability.participant_id == body.participant_id,
                Availability.date == body.date,
            )
        )
        await db.flush()
        return None
