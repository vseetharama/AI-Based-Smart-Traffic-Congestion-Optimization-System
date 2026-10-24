import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import RoadCard from "../components/RoadCard";
import BackendStatus from "../components/BackendStatus";
import { getDashboard } from "../api/trafficApi";

function Dashboard({ liveOnly = false }) {
  const [roads, setRoads] = useState([]);
  const [currentGreenRoad, setCurrentGreenRoad] = useState(null);
  const [signalTimer, setSignalTimer] = useState(0);
  const [systemStatus, setSystemStatus] = useState("WAITING_FOR_VIDEO");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMountedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchDashboardData = async (isInitialFetch = false) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        if (isInitialFetch && !hasInitialLoadRef.current) {
          setLoading(true);
        }
        setError("");

        const data = await getDashboard();

        if (!isMountedRef.current) {
          return;
        }

        const summaries = data?.road_summaries || {};
        const mappedRoads = Object.entries(summaries)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([roadId, summary]) => ({
            id: roadId,
            name: `Road ${roadId.replace("road", "")}`,
            signal: (summary?.signal_status || "RED").toUpperCase(),
            timer:
              data?.current_green_road === roadId
                ? data?.current_timer ?? summary?.recommended_green_time ?? 0
                : summary?.recommended_green_time ?? 0,
            remainingTime: data?.current_green_road === roadId ? data?.current_timer ?? 0 : 0,
            waitingTime: data?.current_green_road === roadId ? 0 : summary?.waiting_time ?? 0,
            vehicleCount: summary?.vehicle_count ?? 0,
            predictedVehicleCount: summary?.predicted_vehicle_count ?? 0,
            predictionStatus: summary?.prediction_status || "unknown",
            densityLevel: summary?.density_level || "UNKNOWN",
            densityScore: summary?.density_score ?? 0,
            hybridScore: summary?.hybrid_score ?? 0,
            estimatedWaiting: summary?.waiting_time ?? 0,
            priority: summary?.priority || "",
            recommendedGreenTime: summary?.recommended_green_time ?? 0,
            lastUpdated: summary?.last_updated || null,
          }));

        hasInitialLoadRef.current = true;
        setLoading(false);
        setRoads(mappedRoads);
        setCurrentGreenRoad(data?.current_green_road || null);
        setSignalTimer(data?.current_timer ?? 0);
        setSystemStatus(data?.system_status || "WAITING_FOR_VIDEO");
      } catch {
        if (!isMountedRef.current) {
          return;
        }

        setError("Unable to load dashboard data.");
        setRoads([]);
      } finally {
        if (isMountedRef.current && !hasInitialLoadRef.current) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchDashboardData(true);

    const intervalId = window.setInterval(() => {
      fetchDashboardData(false);
    }, 1000);

    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Layout standalone={liveOnly}>

      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-3">
          🚦 Live Monitoring Dashboard
        </h1>
        <p className="text-gray-400 text-lg">
          Real-time traffic monitoring with live signal and vehicle insights.
        </p>
      </div>

      <BackendStatus />

      {!liveOnly && (
        <div className="d-flex justify-content-center mb-4">
          <Link to="/analytics" className="btn btn-outline-light">
            View Analytics →
          </Link>
        </div>
      )}

      {liveOnly && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
            padding: "18px",
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Current Green Road</div>
            <strong>{currentGreenRoad ? currentGreenRoad.replace("road", "Road ") : "None"}</strong>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Signal Timer</div>
            <strong>{signalTimer} sec</strong>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>System Status</div>
            <strong>{error ? "OFFLINE" : systemStatus}</strong>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", marginBottom: "20px", color: "#cbd5e1" }}>
          Loading dashboard data...
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", marginBottom: "20px", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px"
        }}
      >
        {roads.map((road, i) => (
          <RoadCard key={i} road={road} />
        ))}
      </div>

    </Layout>
  );
}

export default Dashboard;