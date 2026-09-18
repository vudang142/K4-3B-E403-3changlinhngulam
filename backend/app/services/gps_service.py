"""
GPS Service - Distance calculation
Uses Haversine formula to calculate distance between two GPS coordinates
"""
import math
from typing import Tuple


class GPSService:
    # Earth's radius in meters
    EARTH_RADIUS = 6371000

    @staticmethod
    def calculate_distance(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula.

        Args:
            lat1: Latitude of point 1
            lon1: Longitude of point 1
            lat2: Latitude of point 2
            lon2: Longitude of point 2

        Returns:
            Distance in meters
        """
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        # Haversine formula
        a = (
            math.sin(delta_lat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) *
            math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = GPSService.EARTH_RADIUS * c
        return round(distance, 2)

    @staticmethod
    def is_within_radius(
        student_lat: float,
        student_lon: float,
        room_lat: float,
        room_lon: float,
        radius_meters: float
    ) -> Tuple[bool, float]:
        """
        Check if student is within a radius from the room.

        Args:
            student_lat: Student GPS latitude
            student_lon: Student GPS longitude
            room_lat: Room GPS latitude
            room_lon: Room GPS longitude
            radius_meters: Radius to check in meters

        Returns:
            (is_within, distance)
        """
        distance = GPSService.calculate_distance(
            student_lat, student_lon,
            room_lat, room_lon
        )
        return (distance <= radius_meters, distance)


# Singleton instance
_gps_service = GPSService()


def get_gps_service() -> GPSService:
    return _gps_service
