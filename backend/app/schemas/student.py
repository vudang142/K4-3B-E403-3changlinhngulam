from pydantic import BaseModel
from datetime import datetime


class StudentResponse(BaseModel):
    student_code: str
    full_name: str
    email: str

    class Config:
        from_attributes = True
