"""
QR Service - Dynamic QR token generation and validation
"""
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple


class QRService:
    TOKEN_LENGTH = 32
    TOKEN_PREFIX = "PRS"

    @staticmethod
    def generate_token() -> str:
        """
        Generate a secure dynamic QR token.

        Returns:
            A secure random token string
        """
        random_bytes = secrets.token_bytes(QRService.TOKEN_LENGTH)
        random_hex = random_bytes.hex()
        return f"{QRService.TOKEN_PREFIX}_{random_hex}"

    @staticmethod
    def generate_qr_url(token: str, base_url: str = "http://localhost:3000/attendance") -> str:
        """
        Generate a QR URL for the student to scan.

        Args:
            token: The QR token
            base_url: Base URL for the attendance page

        Returns:
            Full URL to be encoded in QR
        """
        return f"{base_url}/{token}"

    @staticmethod
    def validate_token_format(token: str) -> Tuple[bool, Optional[str]]:
        """
        Validate the token format.

        Args:
            token: Token to validate

        Returns:
            (is_valid, error_message)
        """
        if not token:
            return False, "Token is empty"

        parts = token.split("_")
        if len(parts) != 2:
            return False, "Invalid token format"

        prefix, random_part = parts
        if prefix != QRService.TOKEN_PREFIX:
            return False, "Invalid token prefix"

        if len(random_part) != QRService.TOKEN_LENGTH * 2:  # hex = 2x bytes
            return False, "Invalid token length"

        return True, None


# Singleton instance
_qr_service = QRService()


def get_qr_service() -> QRService:
    return _qr_service
