from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any


# QR Validation Response
class QRValidationResponse(BaseModel):
    valid: bool
    session_id: Optional[str] = None
    class_name: Optional[str] = None
    room: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[str] = None


# Check-in Request
class CheckInRequest(BaseModel):
    qr_token: str = Field(..., description="QR token from scanned QR code")
    student_code: str = Field(..., description="Student code, e.g., HV001")
    full_name: str = Field(..., description="Student full name")
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    gps_accuracy: float = Field(..., description="GPS accuracy in meters")


# AI Result
class AIResult(BaseModel):
    status: str = Field(..., description="CONFIRMED, VERIFY, or SUSPICIOUS")
    confidence: int = Field(..., ge=0, le=100)
    reasoning: str
    uncertainty: List[str] = []


# Check-in Response
class CheckInResponse(BaseModel):
    success: bool
    attendance_id: Optional[str] = None
    status: Optional[str] = None  # CONFIRMED, VERIFY, SUSPICIOUS
    confidence: Optional[int] = None
    message: str


# Attendance List Item
class AttendanceListItem(BaseModel):
    attendance_id: str
    student_code: str
    full_name: str
    checked_in_at: datetime
    gps_distance: float
    ai_confidence: Optional[int]
    status: str  # CONFIRMED, VERIFY, SUSPICIOUS, PRESENT, ABSENT

    class Config:
        from_attributes = True


# Attendance Detail
class AttendanceDetailResponse(BaseModel):
    attendance_id: str
    student_code: str
    full_name: str
    checked_in_at: datetime

    # Evidence
    latitude: float
    longitude: float
    gps_accuracy: float
    distance_to_room: float
    qr_valid: bool
    session_active: bool
    student_in_class: bool
    not_duplicate: bool
    check_in_time: str
    session_start: str

    # AI Result
    ai_status: Optional[str]
    ai_confidence: Optional[int]
    ai_reasoning: Optional[str]
    ai_uncertainty: Optional[List[str]]

    # Final Status
    final_status: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True


# Coach Review Request
class CoachReviewRequest(BaseModel):
    final_status: str = Field(..., pattern="^(PRESENT|ABSENT)$")
    reviewed_by: str = Field(..., description="Coach user ID")
