from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Plan, Participant
from ..schemas import ParticipantCreate, ParticipantRead, ParticipantUpdate

router = APIRouter()


@router.get("/{plan_id}/participants", response_model=list[ParticipantRead])
async def list_participants(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.plan_id == plan_id).order_by(Participant.id))
    return list(result.scalars().all())


@router.post("/{plan_id}/participants", response_model=ParticipantRead)
async def create_participant(plan_id: int, body: ParticipantCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plan not found")
    participant = Participant(plan_id=plan_id, name=body.name)
    db.add(participant)
    await db.flush()
    await db.refresh(participant)
    return participant


@router.patch("/{plan_id}/participants/{participant_id}", response_model=ParticipantRead)
async def update_participant(
    plan_id: int, participant_id: int, body: ParticipantUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Participant).where(Participant.id == participant_id, Participant.plan_id == plan_id)
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(participant, k, v)
    await db.flush()
    await db.refresh(participant)
    return participant


@router.delete("/{plan_id}/participants/{participant_id}", status_code=204)
async def delete_participant(plan_id: int, participant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Participant).where(Participant.id == participant_id, Participant.plan_id == plan_id)
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    await db.delete(participant)
    return None
