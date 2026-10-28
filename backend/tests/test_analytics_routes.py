import sys
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from bson import ObjectId

sys.path.insert(0, "../")

import app as flask_app


class AnalyticsRouteContractTests(unittest.TestCase):
    def setUp(self):
        self.client = flask_app.app.test_client()

    def test_weekly_route_returns_summary_payload_directly(self):
        payload = {"status": "success", "summary": {"totalVehicles": 10}, "charts": {"trafficTrend": []}}

        with patch("app.get_weekly_summary", return_value=payload):
            response = self.client.get("/analytics/weekly")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), payload)

    def test_monthly_route_returns_summary_payload_directly(self):
        payload = {"status": "success", "summary": {"totalVehicles": 10}, "charts": {"trafficTrend": []}}

        with patch("app.get_monthly_summary", return_value=payload):
            response = self.client.get("/analytics/monthly")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), payload)

    def test_history_route_serializes_mongodb_object_ids(self):
        object_id = ObjectId("507f1f77bcf86cd799439011")
        record = {
            "_id": object_id,
            "timestamp": datetime.now(timezone.utc),
            "road_name": "Road 1",
            "vehicle_count": 5,
            "density_level": "MEDIUM",
            "signal_status": "RED",
            "waiting_time": 30,
            "recommended_green_time": 60,
            "prediction": "unknown",
        }

        with patch("app.get_history", return_value=[record]):
            response = self.client.get("/analytics/history")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["records"][0]["_id"], str(object_id))


if __name__ == "__main__":
    unittest.main()
