from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True)
    student_code = Column(String, unique=True, nullable=False)  # HV001
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    enrollments = relationship("ClassStudent", back_populates="student")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
