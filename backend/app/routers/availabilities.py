"""Sparse availability: we only store rows where is_available is True. Toggle = set or delete."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from ..database import get_db
from ..models import Plan, Participant, Availability
from ..schemas import AvailabilityRead, AvailabilityToggle, AvailabilityBatchResult

router = APIRouter()


@router.get("/{plan_id}/availabilities", response_model=list[AvailabilityRead])
async def list_availabilities(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Availability).where(Availability.plan_id == plan_id))
    return list(result.scalars().all())


@router.put("/{plan_id}/availabilities/toggle", response_model=AvailabilityRead | None)
async def toggle_availability(
    plan_id: int, body: AvailabilityToggle, db: AsyncSession = Depends(get_db)
):
    """Sparse: if status is 'yes', 'maybe', or 'no', upsert a row; if 'unknown', delete the row if it exists."""
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

    if body.status != "unknown":
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
            existing.status = body.status
            await db.flush()
            await db.refresh(existing)
            return existing
        avail = Availability(
            plan_id=plan_id,
            participant_id=body.participant_id,
            date=body.date,
            status=body.status,
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


@router.put("/{plan_id}/availabilities/batch", response_model=AvailabilityBatchResult)
async def batch_toggle_availability(
    plan_id: int, body: list[AvailabilityToggle], db: AsyncSession = Depends(get_db)
):
    if not body:
        return AvailabilityBatchResult(updated_count=0, deleted_count=0)

    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plan not found")

    participant_ids = {item.participant_id for item in body}
    if participant_ids:
        result = await db.execute(
            select(Participant.id).where(
                Participant.plan_id == plan_id,
                Participant.id.in_(participant_ids),
            )
        )
        valid_ids = {row[0] for row in result.all()}
        invalid = participant_ids - valid_ids
        if invalid:
            raise HTTPException(status_code=404, detail="Participant not found")

    updated = 0
    deleted_count = 0

    for item in body:
        if item.status != "unknown":
            r = await db.execute(
                select(Availability).where(
                    Availability.plan_id == plan_id,
                    Availability.participant_id == item.participant_id,
                    Availability.date == item.date,
                )
            )
            existing = r.scalar_one_or_none()
            if existing:
                existing.status = item.status
            else:
                db.add(
                    Availability(
                        plan_id=plan_id,
                        participant_id=item.participant_id,
                        date=item.date,
                        status=item.status,
                    )
                )
            updated += 1
        else:
            await db.execute(
                delete(Availability).where(
                    Availability.plan_id == plan_id,
                    Availability.participant_id == item.participant_id,
                    Availability.date == item.date,
                )
            )
            deleted_count += 1

    await db.flush()
    return AvailabilityBatchResult(updated_count=updated, deleted_count=deleted_count)
