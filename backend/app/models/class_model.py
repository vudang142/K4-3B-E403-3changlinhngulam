from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # e.g., "AI101 - Tuesday"
    room = Column(String, nullable=False)  # e.g., "E403"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    students = relationship("ClassStudent", back_populates="class_model")
    sessions = relationship("AttendanceSession", back_populates="class_model")


class ClassStudent(Base):
    __tablename__ = "class_students"

    id = Column(String, primary_key=True)
    class_id = Column(String, ForeignKey("classes.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    class_model = relationship("Class", back_populates="students")
    student = relationship("Student", back_populates="enrollments")
