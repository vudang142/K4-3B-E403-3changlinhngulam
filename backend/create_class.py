# Tạo class trong database
from app.database import SessionLocal, engine, Base
from app.models import *  # Import all models to register them
import uuid

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

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
students = [
    ("HV001", "Nguyen Van A"),
    ("HV002", "Tran Thi B"),
    ("HV003", "Le Van C"),
    ("HV004", "Pham Thi D"),
    ("HV005", "Hoang Van E"),
]

for code, name in students:
    student = Student(
        id=str(uuid.uuid4()),
        student_code=code,
        full_name=name,
        email=f"{code.lower()}@vinuni.edu.vn"
    )
    db.add(student)
    db.commit()

    # Enroll to class
    from app.models.class_model import ClassStudent
    enrollment = ClassStudent(
        id=str(uuid.uuid4()),
        class_id="class-001",
        student_id=student.id
    )
    db.add(enrollment)
    db.commit()
    print(f"Created student {code}: {name}")

print("\nDone! Created class and 5 students.")
db.close()
