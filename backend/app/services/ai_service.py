"""
AI Service - Groq API Integration
Uses openai/gpt-oss-20b model via Groq
"""
import httpx
from typing import Dict, Any, Optional
from app.config import get_settings

settings = get_settings()


class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "openai/gpt-oss-20b"

    async def verify_attendance(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send attendance evidence to AI for verification.

        Args:
            evidence: {
                "student_code": "HV001",
                "gps_distance": 18,
                "gps_accuracy": 12,
                "qr_valid": True,
                "check_in_time": "08:02",
                "session_start": "08:00"
            }

        Returns:
            {
                "status": "CONFIRMED" | "VERIFY" | "SUSPICIOUS",
                "confidence": 0-100,
                "reasoning": "...",
                "uncertainty": []
            }
        """
        prompt = self._build_prompt(evidence)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": """You are an attendance verification AI.

Analyze the attendance evidence. Determine whether the evidence is consistent with the student being physically present in the classroom.

Consider ALL signals together:
- GPS distance: how reasonable is this distance?
- QR validity: expired/invalid tokens suggest suspicious behavior
- Check-in timing: consistent with session start?
- Overall pattern: do all signals align?

IMPORTANT RULES:
1. GPS < 50m with all other signals OK → CONFIRMED
2. GPS 50-100m OR one weak signal → VERIFY
3. GPS > 100m OR invalid QR OR no device match → SUSPICIOUS

Return ONLY valid JSON, no markdown:
{"status": "CONFIRMED|VERIFY|SUSPICIOUS", "confidence": 0-100, "reasoning": "...", "uncertainty": ["..."]}"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, json=payload, headers=headers)

            if response.status_code != 200:
                raise Exception(f"AI API error: {response.status_code} - {response.text}")

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")

            import json
            result = json.loads(content)

            return {
                "status": result.get("status", "VERIFY").upper(),
                "confidence": result.get("confidence", 50),
                "reasoning": result.get("reasoning", ""),
                "uncertainty": result.get("uncertainty", [])
            }

    def _build_prompt(self, evidence: Dict[str, Any]) -> str:
        return f"""Attendance Evidence:
- Student Code: {evidence.get('student_code', 'N/A')}
- GPS Distance from classroom: {evidence.get('gps_distance', 'N/A')}m
- GPS Accuracy: {evidence.get('gps_accuracy', 'N/A')}m
- QR Token Valid: {'Yes' if evidence.get('qr_valid') else 'No'}
- Check-in Time: {evidence.get('check_in_time', 'N/A')}
- Session Start Time: {evidence.get('session_start', 'N/A')}

Analyze if all these signals are consistent with the student being physically present."""


# Singleton instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService(api_key=settings.GROQ_API_KEY)
    return _ai_service
