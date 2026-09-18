"""
Seed script - Chạy trực tiếp trong backend context
"""
import sys
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app.models import *

# Import models explicitly
from app.models.class_model import Class, ClassStudent
from app.models.student import Student
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if class exists
existing = db.query(Class).filter(Class.id == "class-001").first()
if existing:
    print("Class already exists!")
else:
    # Tạo class
    class_obj = Class(
        id="class-001",
        name="CS-401: Distributed Systems Lab",
        room="E403",
        latitude=21.0072,
        longitude=105.8454
    )
    db.add(class_obj)
    db.commit()
    print("Created class!")

# Tạo students
students_data = [
    ("HV001", "Nguyen Van A"),
    ("HV002", "Tran Thi B"),
    ("HV003", "Le Van C"),
    ("HV004", "Pham Thi D"),
    ("HV005", "Hoang Van E"),
]

for code, name in students_data:
    existing_student = db.query(Student).filter(Student.student_code == code).first()
    if existing_student:
        print(f"Student {code} already exists")
        continue

    student = Student(
        id=str(uuid.uuid4()),
        student_code=code,
        full_name=name,
        email=f"{code.lower()}@vinuni.edu.vn"
    )
    db.add(student)
    db.commit()

    # Enroll to class
    enrollment = ClassStudent(
        id=str(uuid.uuid4()),
        class_id="class-001",
        student_id=student.id
    )
    db.add(enrollment)
    db.commit()
    print(f"Created student {code}: {name}")

print("\nDone!")
db.close()
