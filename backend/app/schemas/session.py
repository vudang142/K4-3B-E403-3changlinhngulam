from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# Request
class CreateSessionRequest(BaseModel):
    class_id: str = Field(..., description="Class ID")
    room: str = Field(..., description="Room name, e.g., E403")
    duration_minutes: int = Field(30, ge=5, le=120, description="Session duration in minutes")


# Response
class SessionResponse(BaseModel):
    session_id: str
    qr_url: str
    expires_at: datetime
    started_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class SessionDetailResponse(BaseModel):
    session_id: str
    class_id: str
    room: str
    started_at: datetime
    expires_at: datetime
    duration_minutes: int
    is_active: bool
    total_checkins: int = 0
    confirmed_count: int = 0
    verify_count: int = 0
    suspicious_count: int = 0

    class Config:
        from_attributes = True
