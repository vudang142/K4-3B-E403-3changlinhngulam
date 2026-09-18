"""
Attendance API - QR validation and student check-in
Uses in-memory state service (no database required)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.services.state_service import get_state_service
from app.services.gps_service import get_gps_service
from app.services.ai_service import get_ai_service

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

# Request models
class CheckInRequest(BaseModel):
    session_id: str
    student_code: str
    full_name: str
    latitude: float
    longitude: float
    gps_accuracy: float


class CoachReviewRequest(BaseModel):
    final_status: str  # PRESENT or ABSENT
    reviewed_by: str


# Response models
class QRValidationResponse(BaseModel):
    valid: bool
    session_id: Optional[str] = None
    class_name: Optional[str] = None
    room: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None


class CheckInResponse(BaseModel):
    success: bool
    attendance_id: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[int] = None
    message: str


class AttendanceListItem(BaseModel):
    attendance_id: str
    student_code: str
    full_name: str
    checked_in_at: str
    check_in_time: str
    gps_distance: float
    ai_confidence: Optional[int]
    status: str


class SessionExportResponse(BaseModel):
    session: dict
    summary: dict
    checkins: list


@router.get("/{qr_token}", response_model=QRValidationResponse)
async def validate_qr(qr_token: str):
    """Validate QR token when student scans it"""
    state = get_state_service()
    is_valid, session, error = state.validate_token(qr_token)

    if not is_valid:
        return QRValidationResponse(valid=False, error=error)

    return QRValidationResponse(
        valid=True,
        session_id=session["session_id"],
        class_name=session["class_id"],
        room=session["room"],
        expires_at=session["expires_at"].isoformat()
    )


@router.post("/check-in", response_model=CheckInResponse)
async def check_in(request: CheckInRequest):
    """
    Student check-in endpoint.
    Validates, calls AI, records check-in, returns result.
    """
    state = get_state_service()
    gps_service = get_gps_service()

    # Validate session
    session = state.get_session(request.session_id)
    if not session:
        return CheckInResponse(success=False, message="Session not found")

    if datetime.now() > session["expires_at"]:
        return CheckInResponse(success=False, message="Session has expired")

    # Check for duplicate
    checkins = state.get_session_checkins(request.session_id)
    for checkin in checkins:
        if checkin["student_code"] == request.student_code:
            return CheckInResponse(
                success=False,
                message=f"Student {request.student_code} already checked in"
            )

    # Calculate GPS distance (assuming classroom coordinates)
    # Default classroom coordinates (E403 approximate)
    classroom_lat = 21.0072
    classroom_lon = 105.8454
    distance_to_room = gps_service.calculate_distance(
        request.latitude, request.longitude,
        classroom_lat, classroom_lon
    )

    # Prepare evidence for AI
    check_in_time = datetime.now().strftime("%H:%M:%S")
    session_start = session["started_at"].strftime("%H:%M:%S")

    evidence = {
        "student_code": request.student_code,
        "gps_distance": distance_to_room,
        "gps_accuracy": request.gps_accuracy,
        "qr_valid": True,
        "check_in_time": check_in_time,
        "session_start": session_start
    }

    # Call AI
    ai_service = get_ai_service()
    try:
        ai_result = await ai_service.verify_attendance(evidence)
    except Exception as e:
        print(f"AI error: {e}")
        # Fallback if AI fails
        ai_result = {
            "status": "VERIFY",
            "confidence": 50,
            "reasoning": "AI service unavailable",
            "uncertainty": ["AI error"]
        }

    # Record check-in
    success, record, error = state.checkin(
        session_id=request.session_id,
        student_code=request.student_code,
        full_name=request.full_name,
        latitude=request.latitude,
        longitude=request.longitude,
        gps_accuracy=request.gps_accuracy,
        distance_to_room=distance_to_room,
        check_in_time=check_in_time,
        ai_status=ai_result["status"],
        ai_confidence=ai_result["confidence"],
        ai_reasoning=ai_result["reasoning"]
    )

    if not success:
        return CheckInResponse(success=False, message=error)

    return CheckInResponse(
        success=True,
        attendance_id=record["id"],
        status=ai_result["status"],
        confidence=ai_result["confidence"],
        message="Check-in successful"
    )


@router.get("/session/{session_id}")
async def get_session_checkins(session_id: str):
    """Get all check-ins for a session"""
    state = get_state_service()
    session = state.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    checkins = state.get_session_checkins(session_id)

    # Format for response
    attendance_list = []
    for c in checkins:
        if c["final_status"]:
            status = c["final_status"]
        elif c["ai_status"]:
            status = c["ai_status"]
        else:
            status = "PENDING"

        attendance_list.append(AttendanceListItem(
            attendance_id=c["id"],
            student_code=c["student_code"],
            full_name=c["full_name"],
            checked_in_at=c["checked_in_at"].isoformat(),
            check_in_time=c["check_in_time"],
            gps_distance=c["distance_to_room"],
            ai_confidence=c["ai_confidence"],
            status=status
        ))

    return {
        "session_id": session_id,
        "room": session["room"],
        "is_active": session["is_active"],
        "summary": {
            "total": session["checkin_count"],
            "confirmed": session["confirmed_count"],
            "verify": session["verify_count"],
            "suspicious": session["suspicious_count"]
        },
        "attendance": attendance_list
    }


@router.get("/session/{session_id}/export")
async def export_session(session_id: str):
    """Export session as JSON"""
    state = get_state_service()
    data = state.export_session_json(session_id)

    if not data:
        raise HTTPException(status_code=404, detail="Session not found")

    return data


@router.post("/{attendance_id}/review")
async def coach_review(attendance_id: str, request: CoachReviewRequest):
    """Lab Coach reviews an attendance record"""
    state = get_state_service()

    # Find the attendance record
    for session_id, checkins in []:  # Would need to iterate through sessions
        for checkin in checkins:
            if checkin["id"] == attendance_id:
                checkin["final_status"] = request.final_status
                checkin["reviewed_by"] = request.reviewed_by
                checkin["reviewed_at"] = datetime.now()
                return {"success": True, "message": f"Marked as {request.final_status}"}

    raise HTTPException(status_code=404, detail="Attendance record not found")
