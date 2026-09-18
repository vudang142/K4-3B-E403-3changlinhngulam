from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String, primary_key=True)
    session_id = Column(String, ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=False)

    # AI Result
    ai_status = Column(String, nullable=True)  # CONFIRMED, VERIFY, SUSPICIOUS
    ai_confidence = Column(Integer, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    ai_uncertainty = Column(JSON, nullable=True)

    # Final Status (after coach review)
    final_status = Column(String, nullable=True)  # PRESENT, ABSENT
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("AttendanceSession", back_populates="attendance_records")
    student = relationship("Student", back_populates="attendance_records")
    evidence = relationship("AttendanceEvidence", back_populates="record", uselist=False)


class AttendanceEvidence(Base):
    __tablename__ = "attendance_evidence"

    id = Column(String, primary_key=True)
    record_id = Column(String, ForeignKey("attendance_records.id"), nullable=False)

    # GPS Data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    gps_accuracy = Column(Float, nullable=True)
    distance_to_room = Column(Float, nullable=False)  # Calculated by backend

    # Validation
    qr_valid = Column(Boolean, default=True)
    session_active = Column(Boolean, default=True)
    student_in_class = Column(Boolean, default=True)
    not_duplicate = Column(Boolean, default=True)

    # Timestamps
    check_in_time = Column(String, nullable=False)  # "08:02"
    session_start = Column(String, nullable=False)  # "08:00"

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    record = relationship("AttendanceRecord", back_populates="evidence")
