from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(String, primary_key=True)
    class_id = Column(String, ForeignKey("classes.id"), nullable=False)
    qr_token = Column(String, unique=True, nullable=False)
    room = Column(String, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    class_model = relationship("Class", back_populates="sessions")
    attendance_records = relationship("AttendanceRecord", back_populates="session")
