"""
Sessions API - Lab Coach creates attendance sessions
Uses in-memory state service
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.state_service import get_state_service
from app.config import get_settings

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

# Get public URL from config (Cloudflare tunnel URL)
# Example: https://abc123.trycloudflare.com
settings = get_settings()
PUBLIC_URL = settings.PUBLIC_URL


class CreateSessionRequest(BaseModel):
    class_id: str
    room: str
    duration_minutes: int = 30


class SessionResponse(BaseModel):
    session_id: str
    qr_token: str
    qr_url: str
    room: str
    expires_at: str
    started_at: str
    is_active: bool


class SessionDetailResponse(BaseModel):
    session_id: str
    class_id: str
    room: str
    started_at: str
    expires_at: str
    duration_minutes: int
    is_active: bool
    summary: dict


@router.post("", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    """
    Create a new attendance session.
    Returns QR token and URL for students to scan.
    """
    state = get_state_service()

    session = state.create_session(
        class_id=request.class_id,
        room=request.room,
        duration_minutes=request.duration_minutes
    )

    # Generate QR URL for students to scan
    # Format: https://<cloudflare-url>/check-in?session=ABC123&token=PRS_xxx
    qr_url = f"{PUBLIC_URL}/check-in?session={session['session_id']}&token={session['token']}"

    return SessionResponse(
        session_id=session["session_id"],
        qr_token=session["token"],
        qr_url=qr_url,
        room=session["room"],
        expires_at=session["expires_at"].isoformat(),
        started_at=session["started_at"].isoformat(),
        is_active=session["is_active"]
    )


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: str):
    """Get session details"""
    state = get_state_service()
    session = state.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionDetailResponse(
        session_id=session["session_id"],
        class_id=session["class_id"],
        room=session["room"],
        started_at=session["started_at"].isoformat(),
        expires_at=session["expires_at"].isoformat(),
        duration_minutes=session["duration_minutes"],
        is_active=session["is_active"],
        summary={
            "total": session["checkin_count"],
            "confirmed": session["confirmed_count"],
            "verify": session["verify_count"],
            "suspicious": session["suspicious_count"]
        }
    )


@router.get("/{session_id}/attendance")
async def get_session_attendance(session_id: str):
    """Get all attendance for a session"""
    state = get_state_service()
    session = state.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    checkins = state.get_session_checkins(session_id)

    attendance_list = []
    for c in checkins:
        status = c.get("final_status") or c["ai_status"] or "PENDING"
        attendance_list.append({
            "attendance_id": c["id"],
            "student_code": c["student_code"],
            "full_name": c["full_name"],
            "checked_in_at": c["checked_in_at"].isoformat(),
            "gps_distance": c["distance_to_room"],
            "ai_confidence": c["ai_confidence"],
            "status": status
        })

    return {
        "session_id": session_id,
        "attendance": attendance_list
    }


@router.post("/{session_id}/end")
async def end_session(session_id: str):
    """End a session"""
    state = get_state_service()
    session = state.end_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"success": True, "message": "Session ended"}


@router.get("/{session_id}/export")
async def export_session(session_id: str):
    """Export session as JSON"""
    state = get_state_service()
    data = state.export_session_json(session_id)

    if not data:
        raise HTTPException(status_code=404, detail="Session not found")

    return data
