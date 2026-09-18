"""
Seed API - Tạo test data nhanh
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.student import Student
from app.models.class_model import Class, ClassStudent

router = APIRouter(prefix="/api/seed", tags=["Seed"])


@router.post("/init")
async def init_test_data(db: Session = Depends(get_db)):
    """Tạo test data: class, students"""

    # Tạo class nếu chưa có
    class_obj = db.query(Class).filter(Class.id == "class-001").first()
    if not class_obj:
        class_obj = Class(
            id="class-001",
            name="CS-401: Distributed Systems Lab",
            room="E403",
            latitude=21.0072,
            longitude=105.8454
        )
        db.add(class_obj)

    # Tạo test students
    test_students = [
        ("HV001", "Nguyen Van A"),
        ("HV002", "Tran Thi B"),
        ("HV003", "Le Van C"),
        ("HV004", "Pham Thi D"),
        ("HV005", "Hoang Van E"),
    ]

    for code, name in test_students:
        student = db.query(Student).filter(Student.student_code == code).first()
        if not student:
            student = Student(
                id=str(uuid.uuid4()),
                student_code=code,
                full_name=name,
                email=f"{code.lower()}@vinuni.edu.vn"
            )
            db.add(student)

            # Enroll to class
            enrollment = ClassStudent(
                id=str(uuid.uuid4()),
                class_id="class-001",
                student_id=student.id
            )
            db.add(enrollment)

    db.commit()

    return {"message": "Test data created", "students": len(test_students)}


@router.post("/checkin/{student_code}")
async def mock_checkin(student_code: str, db: Session = Depends(get_db)):
    """Mock check-in cho testing (bỏ qua GPS thật)"""
    from app.api.attendance import check_in_logic

    # Tìm session đang active
    from app.models.session import AttendanceSession
    session = db.query(AttendanceSession).filter(
        AttendanceSession.is_active == True
    ).first()

    if not session:
        return {"error": "No active session"}

    # Mock GPS gần classroom
    mock_lat = 21.0072
    mock_lon = 105.8454

    result = await check_in_logic(
        qr_token=session.qr_token,
        student_code=student_code,
        full_name=f"Student {student_code}",
        latitude=mock_lat,
        longitude=mock_lon,
        gps_accuracy=10,
        db=db
    )

    return result
