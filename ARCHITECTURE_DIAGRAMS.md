# System Architecture & Visual Diagrams

This document contains all visual diagrams for presentations.

---

## 🏗️ 1. SYSTEM ARCHITECTURE (High Level)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                          │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐        │
│  │ Dashboard    │  │ Upload Page  │  │ Analytics & Reports  │        │
│  │ (Real-time   │  │ (Drag-drop   │  │ (Charts, Metrics)    │        │
│  │ Traffic)     │  │ Video)       │  │                      │        │
│  └──────────────┘  └──────────────┘  └──────────────────────┘        │
│         │                │                      │                     │
│         └────────────────┼──────────────────────┘                     │
│                          │                                             │
│              React.js + Vite + Tailwind CSS                           │
│              (Recharts for visualizations)                            │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
                    HTTP REST API
                  (JSON responses)
                         │
┌────────────────────────▼─────────────────────────────────────────────┐
│                     API LAYER (Flask)                                │
│                                                                      │
│  /health   /dashboard   /upload   /analytics   /reports             │
│                   (CORS enabled)                                    │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   [WORKER]      [CONTROLLER]      [LOGGER]
   Threads       Thread            Thread
        │                │                │
        │                │                │
        ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  CORE PROCESSING LAYER                               │
│                                                                      │
│  ┌────────────────────┐    ┌──────────────────────────────────────┐ │
│  │ WORKER THREADS     │    │ TRAFFIC CONTROLLER                   │ │
│  │ (4 concurrent)     │    │                                      │ │
│  │                    │    │ 1. Read road_results (all roads)     │ │
│  │ Road 1  Road 2     │    │ 2. Calculate hybrid scores           │ │
│  │ Road 3  Road 4     │    │ 3. Select green road (MAX score)     │ │
│  │                    │    │ 4. Compute waiting times             │ │
│  │ Each worker:       │    │ 5. Update controller_state           │ │
│  │ 1. Read frame      │    │ 6. Call logger.log_snapshot()        │ │
│  │ 2. YOLO detect     │    │                                      │ │
│  │ 3. Count vehicles  │    │ Updates every 1 second               │ │
│  │ 4. Calc density    │    │                                      │ │
│  │ 5. LSTM predict    │    └──────────────────────────────────────┘ │
│  │ 6. Update state    │                                              │
│  │ 7. Store results   │    ┌──────────────────────────────────────┐ │
│  │                    │    │ TRAFFIC LOGGER (Async)               │ │
│  │ Cycle: ~200ms      │    │                                      │ │
│  │ (frame skip = 5)   │    │ 1. Read queue from controller        │ │
│  └────────────────────┘    │ 2. Detect state changes              │ │
│                            │ 3. Write to MongoDB (non-blocking)   │ │
│                            │ 4. Flush every 10 seconds            │ │
│                            └──────────────────────────────────────┘ │
│                                                                      │
│  SHARED STATE (Thread-safe with locks)                               │
│  ├─ controller_state: {current_green_road, current_timer, ...}      │
│  ├─ road_results: {road1: {...}, road2: {...}, ...}                 │
│  └─ Locks: controller_state_lock, road_results_lock                 │
└────────────────────────┬─────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
      [YOLO]          [LSTM]         [MongoDB]
    Detection       Prediction        Storage
    (GPU)            (CPU)          (Cloud)
```

---

## 🔄 2. DATA FLOW (Single Processing Cycle)

```
TIME T=0s (All 4 workers in parallel)
┌────────────────────────────────────────────────────────────────┐
│ WORKER 1 (Road 1)         WORKER 2 (Road 2)        ...etc       │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 1. Read video frame  │  │ 1. Read video frame  │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 2. YOLO detection    │  │ 2. YOLO detection    │  (GPU Lock)  │
│ │    (acquire lock)    │  │    (wait for lock)   │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 3. Vehicle count: 12 │  │ 3. Vehicle count: 8  │              │
│ │    Confidence: 0.95  │  │    Confidence: 0.92  │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 4. Density calc      │  │ 4. Density calc      │              │
│ │    12/30 = 0.4       │  │    8/30 = 0.27       │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 5. Density level     │  │ 5. Density level     │              │
│ │    MEDIUM (0.33-0.67)│  │    LOW (< 0.33)      │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 6. Recommend green   │  │ 6. Recommend green   │              │
│ │    60 seconds        │  │    40 seconds        │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 7. LSTM prediction   │  │ 7. LSTM prediction   │              │
│ │    History: 14       │  │    History: 9        │              │
│ │    Predicted: 16     │  │    Predicted: 11     │              │
│ │    Status: success   │  │    Status: success   │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 8. Hybrid score      │  │ 8. Hybrid score      │              │
│ │    = 12*0.6 + 16*0.4 │  │    = 8*0.6 + 11*0.4  │              │
│ │    = 13.2            │  │    = 9.0             │              │
│ └──────┬───────────────┘  └──────┬───────────────┘              │
│        │                         │                              │
│        ▼                         ▼                              │
│ ┌──────────────────────┐  ┌──────────────────────┐              │
│ │ 9. Store in state    │  │ 9. Store in state    │              │
│ │ road_results["road1"]│  │ road_results["road2"]│              │
│ └──────────────────────┘  └──────────────────────┘              │
└────────────────────────────────────────────────────────────────┘
                            ↓

TIME T=1s (Controller runs every 1 second)
┌────────────────────────────────────────────────────────────────┐
│ TRAFFIC CONTROLLER DECISION                                    │
├────────────────────────────────────────────────────────────────┤
│ Read all road scores:                                          │
│   road1: 13.2 ← HIGHEST (current: 12, predicted: 16)          │
│   road2: 9.0  (current: 8, predicted: 11)                     │
│   road3: 11.5 (current: 15, predicted: 8)                     │
│   road4: 7.2  (current: 5, predicted: 8)                      │
│                                                                │
│ Decision: Give GREEN to road1 (MAX score = 13.2)              │
│                                                                │
│ Update controller_state:                                      │
│ {                                                              │
│   "current_green_road": "road1",                              │
│   "current_timer": 60,                                        │
│   "last_switch_time": "2024-01-15T10:30:46Z"                 │
│ }                                                              │
│                                                                │
│ Calculate waiting times:                                      │
│   road2: 95 seconds (60 + 35)                                │
│   road3: 135 seconds (60 + 75)                               │
│   road4: 155 seconds (60 + 95)                               │
└────────────────────────────────────────────────────────────────┘
                            ↓

TIME T=1s (Logger stores to MongoDB)
┌────────────────────────────────────────────────────────────────┐
│ TRAFFIC LOGGER (Async Queue Processing)                       │
├────────────────────────────────────────────────────────────────┤
│ Receive snapshot, detect changes (only if state changed)      │
│                                                                │
│ For each road:                                                │
│ {                                                              │
│   "timestamp": "2024-01-15T10:30:46Z",                       │
│   "road_name": "Road 1",                                     │
│   "vehicle_count": 12,                                       │
│   "density_level": "MEDIUM",                                 │
│   "signal_status": "GREEN",                                  │
│   "recommended_green_time": 60,                              │
│   "waiting_time": 0,                                         │
│   "hybrid_score": 13.2,                                      │
│   "predicted_vehicle_count": 16                              │
│ }                                                              │
│                                                                │
│ Write to MongoDB collection: traffic_logs                    │
└────────────────────────────────────────────────────────────────┘
                            ↓

TIME T=0.5s (Frontend polls in parallel)
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND (React Dashboard Poll)                               │
├────────────────────────────────────────────────────────────────┤
│ GET /dashboard                                                 │
│   → trafficApi.js → fetch('/dashboard')                       │
│                                                                │
│ Receive Response:                                             │
│ {                                                              │
│   "current_green_road": "road1",                              │
│   "current_timer": 59,  (was 60, decremented)                │
│   "road_summaries": {                                         │
│     "road1": {vehicle_count: 12, ...},                       │
│     "road2": {vehicle_count: 8, ...},                        │
│     ...                                                        │
│   }                                                            │
│ }                                                              │
│                                                                │
│ Update React state:                                           │
│   - Set road1 to GREEN with timer=59                         │
│   - Set road2,3,4 to RED with waiting times                  │
│   - Re-render RoadCard components                            │
│   - Animate countdown for road1                              │
│                                                                │
│ Poll again after 500ms                                        │
└────────────────────────────────────────────────────────────────┘

TIME T=2-60s
├─ Repeat: Decrement timer (59 → 58 → ... → 0)
├─ Frontend updates every 500ms
└─ Workers continuously process video

TIME T=61s
└─ Controller runs again → SELECT NEW ROAD
   (Highest hybrid score among remaining RED roads)
```

---

## 🧵 3. THREADING MODEL

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MAIN THREAD                                │
│                      (Flask Application)                            │
│                                                                     │
│  ├─ Handle HTTP requests (concurrent with daemon threads)          │
│  ├─ Daemon threads run in background (never block shutdown)        │
│  └─ Each request serves data from shared_state                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─ Daemon: WORKER THREAD 1
         │  ├─ road_id: "road1"
         │  ├─ Continuous: while True
         │  ├─ Frame rate: ~5 fps (with frame_skip=5)
         │  ├─ Reads: video_source
         │  ├─ Calls: YOLO.detect() → LSTM.predict() → state.update()
         │  ├─ Lock usage: yolo_inference_lock, road_results_lock
         │  └─ Daemon: True (exits when main thread exits)
         │
         ├─ Daemon: WORKER THREAD 2
         │  └─ road_id: "road2" (same as WORKER 1)
         │
         ├─ Daemon: WORKER THREAD 3
         │  └─ road_id: "road3" (same as WORKER 1)
         │
         ├─ Daemon: WORKER THREAD 4
         │  └─ road_id: "road4" (same as WORKER 1)
         │
         ├─ Daemon: CONTROLLER THREAD
         │  ├─ Continuous: while True
         │  ├─ Cycle time: 1.0 second
         │  ├─ Reads: road_results (all 4 roads)
         │  ├─ Lock usage: road_results_lock, controller_state_lock
         │  ├─ Selects: GREEN road (max hybrid_score)
         │  ├─ Computes: waiting_times for RED roads
         │  ├─ Updates: controller_state
         │  └─ Calls: logger.log_snapshot()
         │
         └─ Daemon: LOGGER THREAD
            ├─ Continuous: while True
            ├─ Reads: queue (from controller)
            ├─ Processes: Change detection + dedup
            ├─ Writes: MongoDB (async, non-blocking)
            └─ Flush interval: 10 seconds minimum


Thread Safety Mechanisms:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Lock: controller_state_lock (Mutex)                               │
│  ├─ Protects: controller_state dict                                │
│  ├─ Acquired by: Controller thread (write)                         │
│  ├─ Acquired by: Frontend requests (read)                          │
│  └─ Timeout: None (blocking)                                       │
│                                                                     │
│  Lock: road_results_lock (Mutex)                                   │
│  ├─ Protects: road_results dict                                    │
│  ├─ Acquired by: Worker threads 1-4 (write)                        │
│  ├─ Acquired by: Controller thread (read)                          │
│  ├─ Acquired by: Frontend requests (read)                          │
│  └─ Timeout: None (blocking)                                       │
│                                                                     │
│  Lock: yolo_inference_lock (Mutex)                                 │
│  ├─ Protects: Shared YOLO model (GPU access)                       │
│  ├─ Acquired by: Worker threads (one at a time)                    │
│  ├─ Purpose: Prevent concurrent GPU operations                     │
│  └─ Duration: ~200ms per worker cycle                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚦 4. TRAFFIC SIGNAL CONTROL LOGIC

```
DECISION TREE FOR SELECTING GREEN ROAD:

Step 1: Collect Road Scores
┌─────────────────────────────────────────────────────────────────┐
│ For each road (road1, road2, road3, road4):                    │
│                                                                 │
│ Get current data:                                              │
│   ├─ vehicle_count (from YOLO)                                │
│   ├─ predicted_vehicle_count (from LSTM)                      │
│   └─ prediction_status (success/failed)                       │
│                                                                 │
│ Calculate hybrid_score:                                        │
│   If prediction_status == "success":                          │
│     hybrid_score = current*0.6 + predicted*0.4               │
│   Else:                                                        │
│     hybrid_score = current (ignore prediction)               │
│                                                                 │
│ Example:                                                       │
│   road1: current=12, predicted=16 → 12*0.6+16*0.4 = 13.2    │
│   road2: current=8,  predicted=11 → 8*0.6+11*0.4 = 9.0      │
│   road3: current=15, predicted=8  → 15*0.6+8*0.4 = 11.5     │
│   road4: current=5,  predicted=8  → 5*0.6+8*0.4 = 6.2       │
└─────────────────────────────────────────────────────────────────┘
                            ↓

Step 2: Select Winner
┌─────────────────────────────────────────────────────────────────┐
│ Find road with MAX(hybrid_score):                              │
│                                                                 │
│   winners = [                                                   │
│     (13.2, "road1"),  ← HIGHEST                               │
│     (11.5, "road3"),                                          │
│     (9.0,  "road2"),                                          │
│     (6.2,  "road4")                                           │
│   ]                                                             │
│                                                                 │
│   selected = max(winners, key=lambda x: (x[0], -road_num))   │
│   → "road1" (score=13.2, road_num=1)                         │
│                                                                 │
│ Tie-breaker: If scores equal, lower road number wins         │
└─────────────────────────────────────────────────────────────────┘
                            ↓

Step 3: Calculate Waiting Times
┌─────────────────────────────────────────────────────────────────┐
│ For roads NOT selected (road2, road3, road4):                  │
│                                                                 │
│ waiting_time[road] = sum of green times until this road       │
│                                                                 │
│ Algorithm:                                                      │
│   1. Start with current_timer (road1's remaining green time)  │
│   2. Simulate which road gets green next:                     │
│      - Among RED roads, pick MAX(hybrid_score)               │
│      - Add its recommended_green_time                         │
│   3. Repeat until we reach the target road                    │
│                                                                 │
│ Example: (assuming 60s green per cycle)                        │
│   Current GREEN: road1 (remaining: 60s)                       │
│   Next candidates (RED roads only):                           │
│     road3: score=11.5, recommend=80s                         │
│     road2: score=9.0,  recommend=60s                         │
│     road4: score=6.2,  recommend=40s                         │
│                                                                 │
│   Waiting times:                                               │
│   - road3: 60s (road1's timer) → NEXT GREEN                  │
│   - road2: 60s (road1) + 80s (road3) = 140s                  │
│   - road4: 60s (road1) + 80s (road3) + 60s (road2) = 200s   │
│                                                                 │
│ Result: Staggered waiting times (realistic queuing)           │
└─────────────────────────────────────────────────────────────────┘
                            ↓

Step 4: Update System State
┌─────────────────────────────────────────────────────────────────┐
│ controller_state = {                                           │
│   "current_green_road": "road1",                              │
│   "current_timer": 60,                                        │
│   "last_switch_time": "2024-01-15T10:30:46Z",               │
│   "system_status": "running"                                 │
│ }                                                              │
│                                                                 │
│ road_summaries = {                                            │
│   "road1": {                                                   │
│     "signal_status": "GREEN",                                │
│     "waiting_time": 0,                                       │
│     "hybrid_score": 13.2,                                    │
│     ...                                                        │
│   },                                                           │
│   "road2": {                                                   │
│     "signal_status": "RED",                                  │
│     "waiting_time": 140,                                     │
│     "hybrid_score": 9.0,                                     │
│     ...                                                        │
│   },                                                           │
│   ... (road3, road4)                                          │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓

Every 1 second: Decrement current_timer
current_timer: 60 → 59 → 58 → ... → 1 → 0
                                      ↓
                        REPEAT DECISION PROCESS
                        (Select new GREEN road)
```

---

## 📱 5. FRONTEND COMPONENT TREE

```
React App
│
└─ Router (React Router v7)
   │
   ├─ Layout (Wrapper for all pages)
   │  ├─ Navigation Bar
   │  ├─ <Outlet /> (Page content)
   │  └─ Footer
   │
   ├─ Route: /
   │  └─ Home.jsx
   │     ├─ AnimatedHeading
   │     ├─ TechnologyStack
   │     ├─ ArchitectureSection
   │     │  └─ ArchitectureCard (repeated)
   │     └─ WorkflowTimeline
   │        └─ WorkflowStep (repeated)
   │
   ├─ Route: /dashboard
   │  └─ Dashboard.jsx
   │     ├─ BackendStatus (useEffect polling)
   │     ├─ StatsPanel
   │     │  └─ StatsCard (repeated 4 times)
   │     ├─ 2×2 Grid Layout
   │     │  ├─ RoadCard
   │     │  │  ├─ SignalLight (animated)
   │     │  │  ├─ Vehicle count display
   │     │  │  ├─ Density level badge
   │     │  │  ├─ Countdown timer
   │     │  │  ├─ Waiting time
   │     │  │  ├─ Predicted count
   │     │  │  └─ Priority indicator
   │     │  ├─ RoadCard
   │     │  ├─ RoadCard
   │     │  └─ RoadCard
   │     │
   │     └─ ChartsPanel (if analytics enabled)
   │        ├─ LineChart (Recharts)
   │        ├─ BarChart (Recharts)
   │        └─ AreaChart (Recharts)
   │
   ├─ Route: /upload
   │  └─ Upload.jsx
   │     ├─ UploadBox (drag-drop interface)
   │     ├─ File list
   │     ├─ Road selector (radio buttons)
   │     ├─ Progress bar
   │     └─ Status messages
   │
   ├─ Route: /analytics
   │  └─ Analytics.jsx
   │     ├─ Date range picker
   │     ├─ Road filter
   │     ├─ ChartsPanel
   │     │  ├─ Line chart (trends)
   │     │  ├─ Bar chart (comparison)
   │     │  └─ Pie chart (distribution)
   │     └─ Summary statistics
   │
   └─ Route: /members
      └─ Members.jsx
         ├─ Team member cards
         ├─ Contact info
         └─ Social links


Shared Utilities:
├─ api/trafficApi.js (centralized HTTP)
│  ├─ getDashboard()
│  ├─ uploadVideo()
│  ├─ getHealth()
│  ├─ getAnalytics()
│  └─ getReports()
│
├─ utils/dateUtils.js
│  ├─ formatTimestamp()
│  ├─ calculateDateRange()
│  └─ convertTimezone()
│
└─ styles/tokens.js
   ├─ Color palette
   ├─ Spacing scale
   ├─ Font sizes
   └─ Component variants
```

---

## 🗄️ 6. DATABASE SCHEMA (MongoDB)

```
Database: traffic_system

Collection: traffic_logs
├─ TTL Index: { "timestamp": 1 } → Auto-cleanup after 90 days
└─ Documents:

{
  "_id": ObjectId("65a4f2b1c3d4e5f6g7h8i9j0"),
  
  "timestamp": ISODate("2024-01-15T10:30:46.123Z"),
  
  "road_name": "Road 1",
  "road_id": "road1",
  
  "vehicle_count": 12,
  "vehicle_count_confidence": 0.95,
  
  "density_score": 0.4,
  "density_level": "MEDIUM",
  
  "signal_status": "GREEN",
  "signal_duration_seconds": 60,
  
  "waiting_time_seconds": 0,
  "recommended_green_time": 60,
  
  "predicted_vehicle_count": 16,
  "prediction_confidence": 0.87,
  "prediction_status": "success",
  
  "hybrid_score": 13.2,
  "priority_order": 1,
  
  "yolo_inference_time_ms": 145,
  "lstm_inference_time_ms": 23,
  "total_processing_time_ms": 178
}

Collection: analytics_daily_summary
├─ Compound Index: { "date": 1, "road_id": 1 }
└─ Documents (one per road per day):

{
  "_id": ObjectId(...),
  
  "date": ISODate("2024-01-15T00:00:00Z"),
  "road_id": "road1",
  "road_name": "Road 1",
  
  "total_vehicles": 3456,
  "average_vehicle_count": 14.4,
  "peak_vehicle_count": 28,
  "peak_time": "14:30",
  
  "average_density_level": "MEDIUM",
  "high_density_duration_seconds": 3600,
  "medium_density_duration_seconds": 5400,
  "low_density_duration_seconds": 1200,
  
  "total_green_time_seconds": 21600,
  "average_green_time_seconds": 60,
  
  "average_waiting_time": 65.3,
  "max_waiting_time": 240,
  
  "signal_switches": 240,
  "average_cycle_time_seconds": 60
}
```

---

## 🔀 7. API REQUEST/RESPONSE FLOW

```
CLIENT REQUEST ──┐
                 │
                 ▼
     GET /dashboard (from React)
                 │
                 ▼
        trafficApi.js
        request('/dashboard', {
          method: 'GET'
        })
                 │
                 ▼
        Flask app.py
        @app.route('/dashboard', methods=['GET'])
                 │
                 ▼
        Read shared_state (with locks)
                 │
         ┌───────┴─────────┐
         ▼                 ▼
    controller_state   road_results
    (locked read)      (locked read)
         │                 │
         ├─ current_green  ├─ road1 data
         ├─ current_timer  ├─ road2 data
         └─ status         ├─ road3 data
                          └─ road4 data
                 │
                 ▼
        Build response JSON
                 │
                 ▼
        return {
          "current_green_road": "road1",
          "current_timer": 59,
          "system_status": "running",
          "road_summaries": {
            "road1": {
              "signal_status": "GREEN",
              "vehicle_count": 12,
              "density_level": "MEDIUM",
              "waiting_time": 0,
              "predicted_vehicle_count": 16,
              "recommended_green_time": 60,
              ...
            },
            "road2": { ... },
            "road3": { ... },
            "road4": { ... }
          }
        }
                 │
                 ▼
        HTTP 200 (Content-Type: application/json)
                 │
                 ▼
        Frontend receives
                 │
                 ▼
        React state update
        setRoads([...])
                 │
                 ▼
        Re-render RoadCard components
                 │
         ┌───────┴───────┬───────┬───────┐
         ▼               ▼       ▼       ▼
      Road 1         Road 2  Road 3  Road 4
      Signal: GREEN  RED     RED     RED
      Timer: 59s     Wait    Wait    Wait
      Vehicles: 12   Pred: 11 Pred: 8 Pred: 8
                 │
                 ▼
        Poll again after 500ms
```

---

## 🔍 8. ERROR HANDLING FLOW

```
Error Scenario 1: YOLO Model Fails to Load
┌────────────────────────────────────────────────────────┐
│ Worker Thread Start                                    │
│ ├─ load_yolo_model()                                  │
│ │  ├─ Try: Load yolov8n.pt (GPU)                     │
│ │  └─ Except: FileNotFoundError / CUDA error         │
│ │     └─ Return: None                                 │
│ ├─ If model is None:                                  │
│ │  └─ Continue processing but skip YOLO detection    │
│ └─ Update status: "yolo_unavailable"                 │
└────────────────────────────────────────────────────────┘

Error Scenario 2: LSTM Prediction Fails
┌────────────────────────────────────────────────────────┐
│ Worker Thread During Processing                       │
│ ├─ Call: predict_next_vehicle_count(history)         │
│ │  ├─ Try: Load model + scaler                       │
│ │  ├─ Try: Inference                                 │
│ │  └─ Except: TensorFlow error / Missing files       │
│ │     └─ Return: {predicted_count: None,             │
│ │              status: "failed"}                     │
│ ├─ Hybrid score calculation:                         │
│ │  └─ If status != "success":                        │
│ │     └─ score = current only (ignore predicted)    │
│ └─ Proceed normally with degraded scoring            │
└────────────────────────────────────────────────────────┘

Error Scenario 3: MongoDB Connection Lost
┌────────────────────────────────────────────────────────┐
│ Logger Thread Attempting Write                        │
│ ├─ Call: collection.insert_one(document)             │
│ │  └─ PyMongoError: Connection timeout               │
│ ├─ Catch: Log exception                              │
│ ├─ Action: Retry next cycle                          │
│ └─ System continues (in-memory data stays valid)     │
└────────────────────────────────────────────────────────┘

Error Scenario 4: Frontend API Request Fails
┌────────────────────────────────────────────────────────┐
│ Frontend React Component                              │
│ ├─ fetch('/dashboard')                               │
│ │  └─ Network error / 500 server error               │
│ ├─ Catch: Error handling in trafficApi.js            │
│ │  └─ Throw: Error("Unable to load dashboard")      │
│ ├─ Component catch block:                            │
│ │  └─ setError("Unable to load dashboard data.")    │
│ └─ UI: Display error message + last known state      │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ 9. PERFORMANCE OPTIMIZATION

```
Optimization Strategy 1: GPU Sharing (YOLO)
┌──────────────────────────────────────────────────┐
│ Without optimization: Workers run YOLO in parallel
│ Result: GPU memory overflow, crashes              │
│                                                  │
│ With optimization: Use yolo_inference_lock       │
│ ├─ Only one worker uses GPU at a time           │
│ ├─ Others wait for lock (1 thread at a time)    │
│ ├─ Cycle: lock → inference (~150ms) → unlock    │
│ └─ Result: 100% GPU utilization without crashes │
└──────────────────────────────────────────────────┘

Optimization Strategy 2: Frame Skipping (Video)
┌──────────────────────────────────────────────────┐
│ Without optimization: Process every frame        │
│ Result: ~30 fps × 4 workers = 120 fps overhead   │
│                                                  │
│ With optimization: frame_skip = 5               │
│ ├─ Process every 5th frame                      │
│ ├─ Result: ~6 fps × 4 workers = 24 fps overhead│
│ └─ Trade-off: Slight latency for efficiency    │
└──────────────────────────────────────────────────┘

Optimization Strategy 3: Async Database Logging
┌──────────────────────────────────────────────────┐
│ Without optimization: Synchronous writes        │
│ Result: Controller blocks on MongoDB I/O (slow)  │
│                                                  │
│ With optimization: Queue + Background thread    │
│ ├─ Controller: log_snapshot() → queue (1ms)    │
│ ├─ Logger thread: process queue async          │
│ └─ Result: No blocking, smooth real-time      │
└──────────────────────────────────────────────────┘

Optimization Strategy 4: Model Caching (LSTM)
┌──────────────────────────────────────────────────┐
│ Without optimization: Reload model every time   │
│ Result: 500ms overhead per prediction           │
│                                                  │
│ With optimization: Load once, cache globally   │
│ ├─ First call: Load model from disk (500ms)    │
│ ├─ Subsequent: Reuse cached model (23ms)       │
│ └─ Result: 20× speedup                         │
└──────────────────────────────────────────────────┘
```

---

*End of Architecture & Visual Diagrams Document*

---

**Use this document in your presentations by:**
1. 📊 Showing System Architecture Diagram first (big picture)
2. 🔄 Explaining Data Flow (single cycle walkthrough)
3. 🧵 Describing Threading Model (how concurrency works)
4. 🚦 Diving into Control Logic (decision tree)
5. 📱 Showing Frontend Components (what users see)
6. 🗄️ Explaining Database Schema (where data lives)
7. 🔀 Walking through API calls (how everything connects)
8. ⚡ Highlighting Optimizations (why it's fast)

