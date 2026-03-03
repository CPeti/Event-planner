import secrets
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Plan, Participant, Availability
from ..schemas import PlanCreate, PlanRead, PlanUpdate, PlanGrid, GridSummary, ParticipantRead, AvailabilityRead

router = APIRouter()


async def _ensure_share_token(plan: Plan, db: AsyncSession) -> None:
    if plan.share_token is None:
        plan.share_token = secrets.token_urlsafe(24)
        await db.flush()


@router.get("", response_model=list[PlanRead])
async def list_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).order_by(Plan.created_at.desc()))
    plans_list = list(result.scalars().all())
    for plan in plans_list:
        await _ensure_share_token(plan, db)
    return plans_list


@router.get("/by-token/{token}", response_model=PlanRead)
async def get_plan_by_token(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.share_token == token))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await _ensure_share_token(plan, db)
    return plan


@router.post("", response_model=PlanRead)
async def create_plan(body: PlanCreate, db: AsyncSession = Depends(get_db)):
    data = body.model_dump()
    data["share_token"] = secrets.token_urlsafe(24)
    plan = Plan(**data)
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=PlanRead)
async def get_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await _ensure_share_token(plan, db)
    return plan


@router.patch("/{plan_id}", response_model=PlanRead)
async def update_plan(plan_id: int, body: PlanUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)
    await db.flush()
    await _ensure_share_token(plan, db)
    await db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
async def delete_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await db.delete(plan)
    return None


@router.get("/{plan_id}/grid", response_model=PlanGrid)
async def get_plan_grid(plan_id: int, db: AsyncSession = Depends(get_db)):
    """Return plan with participants, sparse availabilities, and per-date counts (summary row)."""
    result = await db.execute(
        select(Plan).where(Plan.id == plan_id).options(selectinload(Plan.participants), selectinload(Plan.availabilities))
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await _ensure_share_token(plan, db)

    participants = [ParticipantRead.model_validate(p) for p in plan.participants]
    availabilities = list(plan.availabilities)

    start = plan.start_date
    end = plan.end_date
    summary_by_date: list[GridSummary] = []
    d = start
    while d <= end:
        yes_count = sum(1 for a in availabilities if a.date == d and a.status == "yes")
        maybe_count = sum(1 for a in availabilities if a.date == d and a.status == "maybe")
        no_count = sum(1 for a in availabilities if a.date == d and a.status == "no")
        summary_by_date.append(GridSummary(date=d, yes_count=yes_count, maybe_count=maybe_count, no_count=no_count))
        d = d + timedelta(days=1)

    return PlanGrid(
        plan=PlanRead.model_validate(plan),
        participants=participants,
        start_date=start,
        end_date=end,
        availabilities=[AvailabilityRead.model_validate(a) for a in availabilities],
        summary_by_date=summary_by_date,
    )
