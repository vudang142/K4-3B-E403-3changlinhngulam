"""
GPS Service - Distance calculation
Uses Haversine formula for straight-line distance
Uses OSRM for road-based routing distance
"""
import math
import httpx
from typing import Tuple, Optional


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
        Calculate straight-line distance between two GPS coordinates using Haversine formula.

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
    async def calculate_routing_distance(
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        profile: str = "foot"  # foot, car, bike
    ) -> Optional[dict]:
        """
        Calculate road-based distance using OSRM routing API.

        Args:
            lat1: Student latitude
            lon1: Student longitude
            lat2: Destination latitude (classroom)
            lon2: Destination longitude
            profile: Routing profile (foot, car, bike)

        Returns:
            dict with distance (meters), duration (seconds), or None if API fails
        """
        try:
            # OSRM public API
            url = f"http://router.project-osrm.org/route/v1/{profile}/{lon1},{lat1};{lon2},{lat2}"
            params = {
                "overview": "false",
                "steps": "false"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        return {
                            "distance": route["distance"],  # meters
                            "duration": route["duration"],  # seconds
                            "straight_line": GPSService.calculate_distance(lat1, lon1, lat2, lon2)
                        }
            return None
        except Exception as e:
            print(f"OSRM routing error: {e}")
            return None

    @staticmethod
    async def get_walking_distance(
        student_lat: float,
        student_lon: float,
        room_lat: float,
        room_lon: float
    ) -> Tuple[float, Optional[dict]]:
        """
        Get walking distance from student to classroom using OSRM.
        Falls back to straight-line distance if API fails.

        Returns:
            (distance_in_meters, routing_details)
        """
        routing = await GPSService.calculate_routing_distance(
            student_lat, student_lon,
            room_lat, room_lon,
            profile="foot"
        )

        if routing:
            return routing["distance"], routing

        # Fallback to straight-line distance
        straight = GPSService.calculate_distance(student_lat, student_lon, room_lat, room_lon)
        return straight, None

    @staticmethod
    def is_within_radius(
        student_lat: float,
        student_lon: float,
        room_lat: float,
        room_lon: float,
        radius_meters: float
    ) -> Tuple[bool, float]:
        """
        Check if student is within a radius from the room (straight-line).

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
