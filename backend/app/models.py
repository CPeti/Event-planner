from datetime import datetime
from sqlalchemy import String, Date, Boolean, DateTime, ForeignKey, UniqueConstraint, Integer, Column
from sqlalchemy.orm import relationship
from .database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    share_token = Column(String(64), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    participants = relationship("Participant", back_populates="plan", cascade="all, delete-orphan")
    availabilities = relationship("Availability", back_populates="plan", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)

    plan = relationship("Plan", back_populates="participants")
    availabilities = relationship("Availability", back_populates="participant", cascade="all, delete-orphan")


class Availability(Base):
    """Sparse: only rows where is_available is True. No row = not available."""
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    __table_args__ = (UniqueConstraint("plan_id", "participant_id", "date", name="uq_plan_participant_date"),)

    plan = relationship("Plan", back_populates="availabilities")
    participant = relationship("Participant", back_populates="availabilities")
