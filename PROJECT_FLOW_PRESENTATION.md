# 🚦 AI-Based Smart Traffic Congestion Optimization System
## Complete Project Flow & Architecture

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Complete Tech Stack](#complete-tech-stack)
3. [System Architecture Flow](#system-architecture-flow)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [Data Flow Pipeline](#data-flow-pipeline)
7. [File Structure & Responsibilities](#file-structure--responsibilities)

---

## 🎯 Project Overview

### **Objective**
Optimize traffic signal timings at 4-way road junctions using:
- **Real-time vehicle detection** (Computer Vision - YOLO)
- **AI-based traffic prediction** (LSTM Neural Networks)
- **Dynamic signal control logic** (Adaptive Timing)
- **Dashboard visualization** (Real-time metrics)

### **Key Problem Solved**
- Reduce traffic congestion at intersections
- Automate signal timing based on live traffic density
- Predict future traffic conditions to allocate green time efficiently

---

## 🛠️ Complete Tech Stack

### **FRONTEND**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React.js** | UI Framework, Component-based architecture | 19.2.5 |
| **Vite** | Build tool & dev server (fast HMR) | 8.0.10 |
| **Tailwind CSS** | Utility-first CSS styling | 3.4.19 |
| **Bootstrap** | Pre-built components & grid system | 5.3.8 |
| **React Router** | Client-side routing & navigation | 7.14.2 |
| **Recharts** | Data visualization for analytics | 3.10.1 |
| **Framer Motion** | Animation library for UI transitions | 12.43.0 |
| **PostCSS** | CSS preprocessor & autoprefixer | 8.5.13 |

### **BACKEND**
| Technology | Purpose | Version |
|------------|---------|---------|
| **Python 3.x** | Server-side language | Latest |
| **Flask** | Web framework & REST API server | 3.0.0 |
| **Flask-CORS** | Cross-Origin Resource Sharing | 4.0.0 |
| **Werkzeug** | WSGI utility library (file uploads) | 3.0.0 |
| **PyMongo** | MongoDB Python driver | 4.17.0 |
| **python-dotenv** | Environment variable management | 1.2.2 |

### **AI/ML MODELS**
| Technology | Purpose | Details |
|------------|---------|---------|
| **YOLOv8n** | Object Detection (vehicle recognition) | Real-time inference (~5fps per road) |
| **OpenCV** | Video processing & frame extraction | cv2 library |
| **LSTM (Keras)** | Time-series prediction for traffic | Predicts next vehicle count |
| **TensorFlow** | Deep Learning framework | For LSTM model loading/inference |
| **NumPy/Pandas** | Data processing & manipulation | Matrix operations & dataframes |

### **DATABASE**
| Technology | Purpose | Details |
|------------|---------|---------|
| **MongoDB** | NoSQL database for traffic logs | Cloud-based (Atlas) |
| **Collections** | traffic_logs (time-series data) | TTL indexes for auto-cleanup |

### **Deployment & Infrastructure**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker (Optional) | Package entire stack |
| **Process Management** | Threading (Python) | Concurrent video processing |
| **State Management** | Shared State + Locks | Thread-safe data sharing |

---

## 🏗️ System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React Frontend - Vite)                      │
│  Dashboard | Upload | Analytics | Members | Navigation          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼ (HTTP REST API)
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK API LAYER                            │
│  /dashboard  /upload  /health  /analytics  /reports             │
│  CORS enabled | JSON responses | Error handling                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   [WORKER]    [CONTROLLER]    [LOGGER]
   Threads      Thread         Thread
        │              │              │
        ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND CORE COMPONENTS                        │
│                                                                  │
│  4 WORKER THREADS (road1-4)           TRAFFIC CONTROLLER        │
│  ┌─────────────────────────────┐      ┌──────────────────────┐  │
│  │ Video Processing Pipeline   │      │ Signal Optimization  │  │
│  │ 1. Video Input              │      │ 1. Hybrid Scoring    │  │
│  │ 2. YOLO Detection           │      │ 2. Road Selection    │  │
│  │ 3. Vehicle Count            │      │ 3. Waiting Time Calc │  │
│  │ 4. Density Calculation      │      │ 4. Signal Switching  │  │
│  │ 5. LSTM Prediction          │      │ 5. Timer Management  │  │
│  │ 6. Result Storage (State)   │      │ 6. State Updates     │  │
│  └─────────────────────────────┘      └──────────────────────┘  │
│                                                                  │
│  TRAFFIC LOGGER (Background)                                    │
│  ┌─────────────────────────────┐                                │
│  │ Asynchronous MongoDB Writer │                                │
│  │ (Non-blocking persistence)  │                                │
│  └─────────────────────────────┘                                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    [YOLO]   [LSTM]    [MongoDB]
    Model    Model     Database
    (GPU)    (CPU)     Logs
```

---

## 📦 Backend Components

### **1. Flask Application (app.py)**
**File**: [backend/app.py](backend/app.py)
**Responsibility**: Main application server & route definitions

**Key Features**:
- Initialize Flask app with CORS
- Configure upload folder (max 2GB files)
- Define REST API endpoints:
  - `GET /health` - System health check
  - `GET /dashboard` - Real-time traffic state
  - `POST /upload` - Video upload endpoint
  - `GET /analytics` - Historical data
  - `GET /reports` - Generate PDF/CSV reports
- Start background threads on initialization
- Handle file uploads with validation

**Key Functions**:
```python
def start_background_threads()      # Initialize worker & controller threads
def initialize_threads()              # One-time initialization
def _worker_thread_main(worker)       # Worker loop
def _initialize_worker_threads()      # Create 4 road workers
def _initialize_controller_thread()   # Start traffic controller
```

---

### **2. Worker Thread (worker.py)**
**File**: [backend/worker.py](backend/worker.py)
**Responsibility**: Process video streams & extract traffic metrics

**Workflow**:
1. **Receive**: Video source for specific road
2. **Process**: Frame-by-frame video analysis
3. **Detect**: YOLO vehicle detection
4. **Compute**: Density metrics & classification
5. **Predict**: LSTM traffic prediction
6. **Store**: Update shared state

**Key Functions**:
```python
class Worker:
    def process_loop()                # Main processing loop
    def _open_video()                 # Open video capture
    def _calculate_density()          # Density = vehicle_count / 30
    def _density_level()              # Classify: LOW/MEDIUM/HIGH
    def _recommend_green_time()       # 40s/60s/120s based on density
    def _update_road_results()        # Store metrics in shared state
```

**Output Metrics** (per road):
- `vehicle_count`: Number detected
- `density_score`: 0-1 (normalized)
- `density_level`: LOW | MEDIUM | HIGH
- `predicted_vehicle_count`: LSTM forecast
- `prediction_status`: success | failed | unavailable
- `recommended_green_time`: 40s | 60s | 120s
- `last_updated`: Timestamp

---

### **3. Traffic Controller (traffic_controller.py)**
**File**: [backend/traffic_controller.py](backend/traffic_controller.py)
**Responsibility**: Intelligent signal switching & timing optimization

**Algorithm**:
1. **Hybrid Scoring**: Combine current & predicted traffic
   - Current traffic: 60% weight (real-time responsiveness)
   - Predicted traffic: 40% weight (future optimization)
   - Formula: `score = current * 0.6 + predicted * 0.4`

2. **Road Selection**: Pick highest priority road for green
   - Select MAX(hybrid_score) from RED roads
   - Avoid immediate re-greening of current road

3. **Waiting Time Calculation**: Simulate future order
   - Estimate when each road will get green
   - Based on their scores & recommended times

4. **Signal Switching**: Update current_green_road every cycle
   - Cycle interval: 1.0 second
   - Persistent updates to shared state

**Key Functions**:
```python
class TrafficController:
    def _hybrid_score(data)          # Weighted score calculation
    def _select_green_road()         # Choose road with highest score
    def _compute_waiting_time()      # Simulate future queue
    def _build_road_summaries()      # Format output data
    def start()                      # Main controller loop
```

---

### **4. Database Module (database.py)**
**File**: [backend/database.py](backend/database.py)
**Responsibility**: MongoDB connection & management

**Features**:
- Connect to MongoDB Atlas (cloud)
- SSL/TLS configuration
- Connection pooling & reusability
- Error handling & retry logic

**Configuration** (.env):
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true
DATABASE_NAME=traffic_system
MONGODB_TLS=true
MONGODB_TLS_ALLOW_INVALID_CERTS=true
```

**Key Functions**:
```python
def get_database()          # Get/create MongoDB connection
def list_collections()      # List all collections
def get_database_name()     # Return configured DB name
```

---

### **5. Traffic Logger (traffic_logger.py)**
**File**: [backend/traffic_logger.py](traffic_logger.py)
**Responsibility**: Async logging to MongoDB (non-blocking)

**Features**:
- Background thread with queue
- Change detection (only log when state changes)
- Flush interval (every 10s minimum)
- Thread-safe operations

**Workflow**:
1. Controller → queue → Logger thread
2. Logger processes queue asynchronously
3. Writes to `traffic_logs` collection
4. Avoids blocking real-time operations

**Logged Data**:
```python
{
    "timestamp": datetime,
    "road_name": "Road 1",
    "vehicle_count": 15,
    "density_level": "MEDIUM",
    "signal_status": "GREEN",
    "recommended_green_time": 60,
    "waiting_time": 45,
    "hybrid_score": 9.2,
    "predicted_vehicle_count": 18
}
```

---

### **6. YOLO Vehicle Detection (yolotest.py)**
**File**: [backend/yolotest.py](backend/yolotest.py)
**Responsibility**: Vehicle detection & counting

**Features**:
- Load YOLOv8n pre-trained model
- Process video frames
- Detect vehicles (cars, trucks, etc.)
- Classify by type (optional)
- Shared model across workers (GPU efficiency)

**Key Functions**:
```python
def load_yolo_model()           # Load model once, reuse
def detect_vehicles(frame)      # Get detections from frame
# Returns: {
#   "total_count": int,
#   "classes": {class_name: count},
#   "boxes": [(x1,y1,x2,y2), ...],
#   "confidences": [0.95, 0.87, ...]
# }
```

---

### **7. LSTM Traffic Prediction (prediction/)**
**File**: [backend/prediction/predictor.py](backend/prediction/predictor.py)
**Responsibility**: Time-series forecasting for traffic

**Files in prediction/**:
- `predictor.py` - Main prediction service
- `lstm_model.py` - Model architecture
- `train.py` - Training script (offline)
- `preprocessing.py` - Data normalization
- `data_loader.py` - Load historical data
- `utils.py` - Helper functions
- `evaluation.py` - Model metrics

**Workflow**:
1. Fetch recent traffic history (last N minutes)
2. Normalize data using scaler
3. Format into LSTM input window
4. Inference: predict next vehicle count
5. Denormalize & return prediction

**Key Functions**:
```python
def _load_model_and_scaler()           # Load once (caching)
def predict_next_vehicle_count(history)  # Get prediction
# Returns: {
#   "predicted_count": int,
#   "status": "success" | "failed",
#   "confidence": float,
#   "timestamp": datetime
# }
```

---

### **8. Analytics Module (analytics.py)**
**File**: [backend/analytics.py](backend/analytics.py)
**Responsibility**: Historical data queries & summaries

**Supported Queries**:
- `get_history()` - Full traffic history (with date filtering)
- `get_today_summary()` - Today's statistics
- `get_weekly_summary()` - Last 7 days
- `get_monthly_summary()` - Last 30 days

**Metrics Calculated**:
- Average vehicle count per road
- Peak density times
- Signal efficiency (green time vs. waiting vehicles)
- Congestion duration

---

### **9. Reports Module (reports.py)**
**File**: [backend/reports.py](backend/reports.py)
**Responsibility**: PDF & CSV report generation

**Reports Available**:
- `build_pdf_report()` - Professional PDF with charts
- `build_csv_report()` - Raw data export

**Contents**:
- Road-wise statistics
- Time-series graphs
- Peak hour analysis
- Efficiency metrics

---

### **10. Shared State Management (shared_state.py)**
**File**: [backend/shared_state.py](backend/shared_state.py)
**Responsibility**: Thread-safe data sharing

**Data Structures**:
```python
controller_state = {
    "current_green_road": "road1",
    "current_timer": 45,
    "system_status": "running",
    "last_switch_time": datetime,
}

road_results = {
    "road1": {
        "vehicle_count": 12,
        "density_score": 0.4,
        "density_level": "MEDIUM",
        "signal_status": "GREEN",
        "predicted_vehicle_count": 14,
        "prediction_status": "success",
        "recommended_green_time": 60,
        "waiting_time": 0,
        "hybrid_score": 8.4,
        "priority": 1,
        "last_updated": datetime,
    },
    # Similar for road2, road3, road4
}

# Thread locks for safe access
controller_state_lock = threading.Lock()
road_results_lock = threading.Lock()
yolo_inference_lock = threading.Lock()  # GPU access control
```

---

## 🎨 Frontend Components

### **Architecture Overview**
```
src/
├── pages/           # Full-page components
├── components/      # Reusable UI components
├── api/            # Backend communication
├── styles/         # CSS & design tokens
└── utils/          # Utility functions
```

---

### **1. Pages (pages/)**

#### **Dashboard.jsx**
**File**: [frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)
**Purpose**: Main traffic control interface

**Features**:
- Real-time polling of backend (/dashboard endpoint)
- Display 4 road cards in 2x2 grid
- Show signal status (RED/GREEN) with countdown
- Display vehicle counts & predictions
- Waiting time visualization
- Backend status indicator

**Data Fetched**:
```javascript
{
  current_green_road: "road1",
  current_timer: 45,
  road_summaries: {
    road1: { vehicle_count, density_level, signal_status, ... },
    road2: { ... },
    road3: { ... },
    road4: { ... }
  }
}
```

---

#### **Upload.jsx**
**File**: [frontend/src/pages/Upload.jsx](frontend/src/pages/Upload.jsx)
**Purpose**: Video upload interface

**Features**:
- Drag-and-drop video upload
- Multiple file selection
- Progress tracking
- Status feedback
- Road assignment (road1-4)

**API Call**:
```javascript
POST /upload
Content-Type: multipart/form-data
{ video file, road_id }
```

---

#### **Analytics.jsx**
**File**: [frontend/src/pages/Analytics.jsx](frontend/src/pages/Analytics.jsx)
**Purpose**: Historical data & charts

**Features**:
- Date range filtering
- Road-wise statistics
- Time-series charts (Recharts)
- Peak hour analysis
- Congestion trends

---

#### **Members.jsx**
**File**: [frontend/src/pages/Members.jsx](frontend/src/pages/Members.jsx)
**Purpose**: Team/project information

---

#### **Home.jsx**
**File**: [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
**Purpose**: Landing page with project overview

---

### **2. Components (components/)**

#### **Layout.jsx**
Wrapper for page structure, navigation, routing

#### **RoadCard.jsx**
Individual road display with:
- Signal light (RED/GREEN visual)
- Vehicle count
- Density level
- Waiting time
- Countdown timer

#### **SignalLight.jsx**
Animated signal indicator
- Green circular light (when GREEN)
- Red circular light (when RED)
- CSS animations

#### **StatsCard.jsx**
Metric display cards
- Vehicle count
- Density level
- Waiting time
- Predicted count

#### **StatsPanel.jsx**
Collection of stats for all 4 roads

#### **ChartsPanel.jsx**
Data visualization area using Recharts
- Line charts (vehicle trends)
- Bar charts (density comparison)
- Pie charts (road distribution)

#### **BackendStatus.jsx**
System health indicator
- Connected/Disconnected status
- Last update time
- API response time

#### **UploadBox.jsx**
Drag-drop video upload interface

#### **AnimatedHeading.jsx**
Title with animations (Framer Motion)

#### **TechnologyStack.jsx**
Display tech stack info

#### **ArchitectureSection.jsx / ArchitectureCard.jsx**
System architecture visualization

#### **WorkflowTimeline.jsx / WorkflowStep.jsx**
Project workflow diagram

---

### **3. API Layer (api/trafficApi.js)**
**File**: [frontend/src/api/trafficApi.js](frontend/src/api/trafficApi.js)
**Responsibility**: Centralized backend communication

**Base URL**: 
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
```

**API Functions**:
```javascript
// Fetch dashboard state
getDashboard()                      // GET /dashboard

// Check backend health
getHealth()                         // GET /health

// Upload videos
uploadVideo(formData)               // POST /upload

// Get analytics
getAnalytics(startDate, endDate)   // GET /analytics

// Get reports
getReports(type, format)            // GET /reports

// Helper function
request(endpoint, options)          // Generic fetch wrapper
```

**Error Handling**:
- Automatic JSON/text parsing
- Consistent error messages
- Status code validation

---

### **4. Styles**
**File**: [frontend/src/styles/tokens.js](frontend/src/styles/tokens.js)
- Design tokens (colors, spacing, fonts)
- Tailwind configuration
- CSS variables

---

### **5. Utilities (utils/)**

#### **dateUtils.js**
- Format timestamps
- Date range calculations
- Timezone conversions

---

## 🔄 Complete Data Flow Pipeline

### **Scenario: Single Processing Cycle**

```
TIME T=0
├─ WORKER THREAD (Road 1)
│  ├─ Read video frame
│  ├─ YOLO detection
│  │  └─ Output: 12 vehicles detected
│  ├─ Calculate density
│  │  └─ density = 12 / 30 = 0.4
│  ├─ Classify density
│  │  └─ density_level = "MEDIUM" (0.33-0.67)
│  ├─ Recommend green time
│  │  └─ 60 seconds (MEDIUM → 60s)
│  ├─ LSTM prediction
│  │  ├─ Fetch history (last 30 min)
│  │  ├─ Predict next vehicle count
│  │  └─ predicted_count = 14 (success)
│  ├─ Calculate hybrid score
│  │  └─ score = 12*0.6 + 14*0.4 = 12.8
│  └─ Update shared state
│     └─ road1: {vehicle_count: 12, density_level: MEDIUM, ...}
│
├─ WORKER THREAD (Road 2)
│  └─ [Similar process for Road 2]
│
├─ WORKER THREAD (Road 3)
│  └─ [Similar process for Road 3]
│
└─ WORKER THREAD (Road 4)
   └─ [Similar process for Road 4]

TIME T=1
├─ TRAFFIC CONTROLLER
│  ├─ Read all road_results
│  ├─ Select road with MAX hybrid_score
│  │  └─ Suppose road2 has highest score
│  ├─ Set current_green_road = "road2"
│  ├─ Set current_timer = 60 (recommended)
│  ├─ Calculate waiting times for others
│  │  ├─ road1: 95 seconds
│  │  ├─ road3: 135 seconds
│  │  └─ road4: 155 seconds
│  └─ Update controller_state
│
├─ TRAFFIC LOGGER (Background)
│  ├─ Check for state changes
│  ├─ Add to queue (async)
│  └─ Write to MongoDB traffic_logs collection
│
└─ FRONTEND POLLING
   ├─ GET /dashboard
   ├─ Receive road_summaries + controller_state
   ├─ Update UI
   │  ├─ Road2 signal → GREEN (visual)
   │  ├─ Countdown timer → 60s
   │  ├─ Other roads → RED
   │  └─ Waiting times displayed
   └─ Re-poll after 500ms

TIME T=2-60
└─ Decrement timer: current_timer--

TIME T=61
└─ [Cycle repeats with updated road data]
```

---

## 📁 File Structure & Responsibilities

### **Backend Files**

| File | Lines | Purpose |
|------|-------|---------|
| `app.py` | ~300 | Main Flask server, route definitions, thread initialization |
| `worker.py` | ~250 | Video processing, YOLO inference, density calculation, state updates |
| `traffic_controller.py` | ~350 | Signal optimization, hybrid scoring, waiting time calculation |
| `database.py` | ~80 | MongoDB connection & configuration |
| `traffic_logger.py` | ~150 | Asynchronous logging to MongoDB |
| `analytics.py` | ~300 | Historical data queries, summary generation |
| `reports.py` | ~200 | PDF/CSV report generation |
| `shared_state.py` | ~50 | Thread-safe state containers & locks |
| `yolotest.py` | ~100 | YOLO model loading & inference |

### **Prediction Submodule** (backend/prediction/)

| File | Purpose |
|------|---------|
| `predictor.py` | Main prediction service, model loading |
| `lstm_model.py` | Model architecture definition |
| `train.py` | Training script (run offline) |
| `preprocessing.py` | Data normalization & feature engineering |
| `data_loader.py` | Load historical data from MongoDB/CSV |
| `utils.py` | Helper functions |
| `evaluation.py` | Model performance metrics |
| `history_loader.py` | Fetch recent traffic history |

### **Frontend Files**

| File | Purpose |
|------|---------|
| `main.jsx` | React entry point |
| `App.jsx` | Root component, routing setup |
| `pages/Dashboard.jsx` | Main traffic dashboard |
| `pages/Upload.jsx` | Video upload interface |
| `pages/Analytics.jsx` | Historical data & charts |
| `pages/Home.jsx` | Landing page |
| `pages/Members.jsx` | Team info |
| `api/trafficApi.js` | Backend communication layer |
| `components/RoadCard.jsx` | Individual road display |
| `components/SignalLight.jsx` | Traffic signal animation |
| `components/StatsPanel.jsx` | Metrics display |
| `components/ChartsPanel.jsx` | Data visualization |
| `components/BackendStatus.jsx` | System health |
| `components/Layout.jsx` | Page wrapper |
| `styles/tokens.js` | Design tokens |
| `utils/dateUtils.js` | Date utilities |

### **Config Files**

| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Python dependencies |
| `backend/.env` | MongoDB credentials, API config |
| `frontend/package.json` | npm dependencies |
| `frontend/vite.config.js` | Vite build configuration |
| `frontend/tailwind.config.js` | Tailwind CSS theme |
| `frontend/postcss.config.js` | PostCSS plugins |
| `frontend/.env` | Frontend API base URL |

---

## 🚀 Execution Flow (Development to Production)

### **Starting the System**

```bash
# Terminal 1: Backend
cd backend
python app.py
# Starts on port 5000
# Initializes 4 worker threads + controller thread

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Starts on port 5173 (Vite dev server)
# Hot module replacement enabled
```

### **Initialization Sequence**

```
Flask App Start
├─ Initialize CORS
├─ Configure upload folder
├─ Create app instance
├─ Define routes
├─ Call start_background_threads()
│  ├─ Create 4 Worker instances (road1-4)
│  │  ├─ Load YOLO model (shared)
│  │  └─ Initialize video capture (empty initially)
│  ├─ Start 4 worker threads (daemon mode)
│  └─ Start traffic controller thread
│     ├─ Initialize TrafficLogger
│     └─ Start main loop
├─ Initialize MongoDB connection
└─ Ready to accept requests
```

---

## 🎓 Key Algorithms Explained

### **Hybrid Score Calculation**
```python
hybrid_score = current_vehicle_count * 0.6 + predicted_vehicle_count * 0.4

# Example:
# Current: 12 vehicles
# Predicted: 20 vehicles
# Hybrid Score = 12 * 0.6 + 20 * 0.4 = 7.2 + 8 = 15.2
```

### **Density Level Classification**
```python
if density_score >= 0.67:
    density_level = "HIGH"      # Green time: 120s
elif density_score >= 0.33:
    density_level = "MEDIUM"    # Green time: 60s
else:
    density_level = "LOW"       # Green time: 40s

# Example: 12 vehicles at road → density = 12/30 = 0.4
# Classification: MEDIUM → 60s green time
```

### **Green Road Selection**
```python
# Algorithm:
# 1. Get all RED roads with their hybrid scores
# 2. Select road with MAX(hybrid_score)
# 3. Avoid immediately re-greening current road
# 4. Handle ties with road_id ordering

selected_road = max(
    [(score, road_id) for road_id, score in scores.items()],
    key=lambda x: (x[0], -road_number)  # Highest score, then lower road#
)
```

---

## 📊 Performance Metrics

| Component | Metric | Value |
|-----------|--------|-------|
| **YOLO Detection** | FPS per road | ~5 fps |
| **Frame Skip** | Frames processed | Every 5th frame |
| **Controller Cycle** | Update interval | 1 second |
| **Frontend Poll** | Refresh rate | 500ms |
| **Prediction Accuracy** | LSTM model | ~85% (trained) |
| **Database Writes** | Async, non-blocking | ~10s flush interval |
| **Max Upload Size** | File limit | 2GB |

---

## 🔒 Thread Safety

All shared data uses thread locks:

```python
# Example: Updating road results
with road_results_lock:
    road_results["road1"] = {
        "vehicle_count": 12,
        "density_level": "MEDIUM",
        # ... other fields
    }

# Example: Reading controller state
with controller_state_lock:
    current_green = controller_state.get("current_green_road")
    timer = controller_state.get("current_timer")
```

---

## 🔌 API Endpoints Summary

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/health` | GET | System health check | `{status: "ok", timestamp}` |
| `/dashboard` | GET | Real-time traffic state | `{road_summaries, controller_state}` |
| `/upload` | POST | Upload video files | `{message, success, road_id}` |
| `/analytics` | GET | Historical data | `{data, summary}` |
| `/reports/pdf` | GET | Generate PDF report | PDF file |
| `/reports/csv` | GET | Generate CSV report | CSV file |

---

## 📈 Future Enhancements (Version 2.0)

- 🚨 Emergency Vehicle Priority Detection
- 🗺️ Multi-junction optimization
- 📱 Mobile app integration
- 🎯 Reinforcement Learning for signal timing
- 🔐 User authentication & roles
- 📊 Advanced analytics dashboard
- 🌍 Geospatial heatmaps
- ⚡ WebSocket real-time updates

---

## 📝 Summary

**The AI Traffic Control System is a real-time, multi-threaded application that:**

1. **Captures** live video from 4 road cameras
2. **Analyzes** traffic using YOLOv8 computer vision
3. **Predicts** future traffic with LSTM neural networks
4. **Optimizes** signal timings using hybrid scoring algorithm
5. **Manages** concurrent operations with thread safety
6. **Persists** data asynchronously to MongoDB
7. **Displays** real-time metrics via React dashboard
8. **Provides** historical analytics & reporting

**Tech Stack Summary:**
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python + Flask + PyMongo
- **AI/ML**: YOLOv8 (detection) + LSTM (prediction)
- **Database**: MongoDB (cloud)
- **Concurrency**: Python threading with locks
- **UI Framework**: Bootstrap + Recharts for visualization

---

*This document provides a complete overview suitable for technical presentations, investor pitches, and developer onboarding.*
