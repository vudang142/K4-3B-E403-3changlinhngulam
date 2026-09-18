"""
In-memory Session State Service
Không cần database - lưu trong memory
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid
import secrets

# In-memory storage
_sessions: Dict[str, dict] = {}
_checkins: Dict[str, list] = {}  # session_id -> list of check-ins
_students: Dict[str, dict] = {}  # student_code -> student info


class StateService:
    """In-memory session and attendance state management"""

    @staticmethod
    def create_session(class_id: str, room: str, duration_minutes: int) -> dict:
        """Create a new attendance session"""
        session_id = str(uuid.uuid4())
        token = f"PRS_{secrets.token_hex(32)}"

        now = datetime.now()
        expires_at = now + timedelta(minutes=duration_minutes)

        session = {
            "session_id": session_id,
            "class_id": class_id,
            "room": room,
            "token": token,
            "started_at": now,
            "expires_at": expires_at,
            "duration_minutes": duration_minutes,
            "is_active": True,
            "checkin_count": 0,
            "confirmed_count": 0,
            "verify_count": 0,
            "suspicious_count": 0
        }

        _sessions[session_id] = session
        _checkins[session_id] = []

        return session

    @staticmethod
    def get_session(session_id: str) -> Optional[dict]:
        """Get session by ID"""
        return _sessions.get(session_id)

    @staticmethod
    def get_session_by_token(token: str) -> Optional[dict]:
        """Get session by QR token"""
        for session in _sessions.values():
            if session["token"] == token:
                return session
        return None

    @staticmethod
    def validate_token(token: str) -> tuple[bool, Optional[dict], str]:
        """
        Validate QR token
        Returns: (is_valid, session, error_message)
        """
        session = StateService.get_session_by_token(token)

        if not session:
            return False, None, "Invalid QR code"

        if not session["is_active"]:
            return False, None, "Session is no longer active"

        if datetime.now() > session["expires_at"]:
            return False, None, "Session has expired"

        return True, session, ""

    @staticmethod
    def register_student(student_code: str, full_name: str) -> dict:
        """Register or update student"""
        student = {
            "student_code": student_code,
            "full_name": full_name,
            "email": f"{student_code.lower()}@vinuni.edu.vn"
        }
        _students[student_code] = student
        return student

    @staticmethod
    def get_student(student_code: str) -> Optional[dict]:
        """Get student by code"""
        return _students.get(student_code)

    @staticmethod
    def checkin(
        session_id: str,
        student_code: str,
        full_name: str,
        latitude: float,
        longitude: float,
        gps_accuracy: float,
        distance_to_room: float,
        check_in_time: str,
        ai_status: str,
        ai_confidence: int,
        ai_reasoning: str
    ) -> tuple[bool, dict, str]:
        """
        Record a check-in
        Returns: (success, checkin_record, error_message)
        """
        session = StateService.get_session(session_id)
        if not session:
            return False, {}, "Session not found"

        if datetime.now() > session["expires_at"]:
            return False, {}, "Session has expired"

        # Check for duplicate
        checkins = _checkins.get(session_id, [])
        for checkin in checkins:
            if checkin["student_code"] == student_code:
                return False, {}, "Already checked in"

        # Register student if not exists
        if not StateService.get_student(student_code):
            StateService.register_student(student_code, full_name)

        # Create check-in record
        checkin_record = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "student_code": student_code,
            "full_name": full_name,
            "checked_in_at": datetime.now(),
            "check_in_time": check_in_time,
            "latitude": latitude,
            "longitude": longitude,
            "gps_accuracy": gps_accuracy,
            "distance_to_room": distance_to_room,
            "ai_status": ai_status,
            "ai_confidence": ai_confidence,
            "ai_reasoning": ai_reasoning,
            "final_status": None,
            "reviewed_by": None,
            "reviewed_at": None
        }

        _checkins[session_id].append(checkin_record)

        # Update session counts
        session["checkin_count"] += 1
        if ai_status == "CONFIRMED":
            session["confirmed_count"] += 1
        elif ai_status == "VERIFY":
            session["verify_count"] += 1
        elif ai_status == "SUSPICIOUS":
            session["suspicious_count"] += 1

        return True, checkin_record, ""

    @staticmethod
    def get_session_checkins(session_id: str) -> List[dict]:
        """Get all check-ins for a session"""
        return _checkins.get(session_id, [])

    @staticmethod
    def end_session(session_id: str) -> Optional[dict]:
        """End a session"""
        session = StateService.get_session(session_id)
        if session:
            session["is_active"] = False
            session["ended_at"] = datetime.now()
        return session

    @staticmethod
    def export_session_json(session_id: str) -> Optional[dict]:
        """Export session data as JSON-serializable dict"""
        session = StateService.get_session(session_id)
        if not session:
            return None

        checkins = StateService.get_session_checkins(session_id)

        return {
            "session": {
                "session_id": session["session_id"],
                "class_id": session["class_id"],
                "room": session["room"],
                "started_at": session["started_at"].isoformat(),
                "expires_at": session["expires_at"].isoformat(),
                "duration_minutes": session["duration_minutes"],
                "is_active": session["is_active"],
                "ended_at": session.get("ended_at", {}).isoformat() if session.get("ended_at") else None
            },
            "summary": {
                "total_checkins": session["checkin_count"],
                "confirmed": session["confirmed_count"],
                "verify": session["verify_count"],
                "suspicious": session["suspicious_count"]
            },
            "checkins": [
                {
                    "student_code": c["student_code"],
                    "full_name": c["full_name"],
                    "checked_in_at": c["checked_in_at"].isoformat(),
                    "check_in_time": c["check_in_time"],
                    "distance_to_room": c["distance_to_room"],
                    "ai_status": c["ai_status"],
                    "ai_confidence": c["ai_confidence"],
                    "ai_reasoning": c["ai_reasoning"],
                    "final_status": c["final_status"],
                    "reviewed_by": c["reviewed_by"],
                    "reviewed_at": c["reviewed_at"].isoformat() if c["reviewed_at"] else None
                }
                for c in checkins
            ]
        }

    @staticmethod
    def get_active_sessions() -> List[dict]:
        """Get all active sessions"""
        return [s for s in _sessions.values() if s["is_active"]]


# Singleton
_state_service = StateService()


def get_state_service() -> StateService:
    return _state_service
