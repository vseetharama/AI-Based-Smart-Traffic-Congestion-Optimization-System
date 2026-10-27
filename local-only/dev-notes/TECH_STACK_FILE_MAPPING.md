# Quick Reference - Tech Stack & File Mapping

## 🎯 Quick Answer to Your Presentation Needs

### Everything Mapped Out

---

## 📱 FRONTEND TECH STACK
```
┌─────────────────────────────────────────┐
│   React 19.2.5 (UI Framework)           │
│   └─ Vite 8.0.10 (Build Tool)           │
│      └─ HMR (Hot Module Replacement)    │
│         └─ Lightning-fast dev experience│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Styling                               │
│   ├─ Tailwind CSS 3.4.19                │
│   ├─ Bootstrap 5.3.8                    │
│   ├─ PostCSS 8.5.13 + Autoprefixer      │
│   └─ CSS Modules                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Components & Features                 │
│   ├─ React Router 7.14.2 (Routing)      │
│   ├─ Recharts 3.10.1 (Data Charts)      │
│   └─ Framer Motion 12.43.0 (Animations)│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Development                           │
│   ├─ ESLint 10.2.1                      │
│   └─ Dev dependencies for build opt.    │
└─────────────────────────────────────────┘
```

---

## 🐍 BACKEND TECH STACK
```
┌─────────────────────────────────────────┐
│   Python 3.x                            │
│   └─ Flask 3.0.0 (Web Framework)        │
│      ├─ Flask-CORS 4.0.0 (API Access)  │
│      └─ Werkzeug 3.0.0 (File Handling) │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Database                              │
│   └─ PyMongo 4.17.0 (MongoDB Driver)   │
│      └─ MongoDB Atlas (Cloud)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Configuration                         │
│   └─ python-dotenv 1.2.2 (.env support)│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   AI/ML Libraries (Not in requirements, │
│   but used via imports)                 │
│   ├─ YOLOv8 (Object Detection)         │
│   ├─ OpenCV (cv2) - Video Processing   │
│   ├─ TensorFlow/Keras - LSTM Models    │
│   ├─ NumPy - Numerical Operations      │
│   └─ Pandas - Data Analysis            │
└─────────────────────────────────────────┘
```

---

## 🤖 AI/ML MODELS
```
┌──────────────────────────────────────────┐
│   YOLOv8n (Nano Model)                   │
│   File: backend/yolov8n.pt               │
│   Purpose: Vehicle Detection in 4K video │
│   Speed: ~5 FPS per road                 │
│   GPU: Shared across 4 workers (locked)  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   LSTM Neural Network                    │
│   File: backend/models/traffic_predictor │
│          .keras                          │
│   Purpose: Predict next vehicle count    │
│   Input: Last 30 minutes traffic history │
│   Output: Predicted count + confidence   │
│   Framework: TensorFlow/Keras            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   Scaler (Data Normalization)            │
│   File: backend/models/scaler.pkl        │
│   Purpose: Normalize data for LSTM      │
│   Format: Pickle binary                  │
└──────────────────────────────────────────┘
```

---

## 📂 FILE STRUCTURE WITH TECH MAPPING

### **FRONTEND** (React + Vite)
```
frontend/
├── package.json                    ← Dependencies (React, Vite, etc.)
├── vite.config.js                 ← Vite build config (HMR, plugins)
├── tailwind.config.js             ← Tailwind CSS theme
├── postcss.config.js              ← PostCSS (Autoprefixer)
├── eslint.config.js               ← Linting rules
├── index.html                     ← Entry HTML
└── src/
    ├── main.jsx                   ← React entry point
    ├── App.jsx                    ← Root component (Routing)
    ├── index.css                  ← Global styles
    ├── App.css                    ← Component styles
    │
    ├── pages/                     ← Full-page components
    │   ├── Dashboard.jsx          ← Main traffic dashboard (polls API)
    │   ├── Upload.jsx             ← Video upload interface
    │   ├── Analytics.jsx          ← Historical data + charts
    │   ├── Home.jsx               ← Landing page
    │   └── Members.jsx            ← Team info
    │
    ├── components/                ← Reusable components
    │   ├── Layout.jsx             ← Page wrapper (nav, footer)
    │   ├── RoadCard.jsx           ← Individual road display
    │   ├── SignalLight.jsx        ← Traffic signal (RED/GREEN)
    │   ├── StatsCard.jsx          ← Metric cards
    │   ├── StatsPanel.jsx         ← Stats collection
    │   ├── ChartsPanel.jsx        ← Recharts visualizations
    │   ├── BackendStatus.jsx      ← Health indicator
    │   ├── UploadBox.jsx          ← Drag-drop upload
    │   ├── AnimatedHeading.jsx    ← Framer Motion titles
    │   ├── TechnologyStack.jsx    ← Tech display
    │   ├── ArchitectureSection.jsx├─ System diagram
    │   ├── ArchitectureCard.jsx   │
    │   ├── WorkflowTimeline.jsx   ├─ Workflow visualization
    │   └── WorkflowStep.jsx       │
    │
    ├── api/                       ← Backend communication
    │   └── trafficApi.js          ← API layer (centralized)
    │                                 ├─ getDashboard()
    │                                 ├─ uploadVideo()
    │                                 ├─ getHealth()
    │                                 ├─ getAnalytics()
    │                                 └─ getReports()
    │
    ├── styles/
    │   └── tokens.js              ← Design tokens
    │
    └── utils/
        └── dateUtils.js           ← Date formatting
```

### **BACKEND** (Python + Flask)
```
backend/
├── app.py                         ← Flask server (Main)
│                                    ├─ Route definitions
│                                    ├─ Thread initialization
│                                    └─ CORS setup
│
├── worker.py                      ← Video processor (4 instances)
│                                    ├─ Video capture
│                                    ├─ YOLO inference
│                                    ├─ Density calculation
│                                    └─ LSTM prediction call
│
├── traffic_controller.py          ← Signal optimizer (1 instance)
│                                    ├─ Hybrid scoring (60/40 split)
│                                    ├─ Road selection algorithm
│                                    ├─ Waiting time calculation
│                                    └─ State updates
│
├── shared_state.py                ← Thread-safe containers
│                                    ├─ controller_state dict
│                                    ├─ road_results dict
│                                    └─ Threading locks
│
├── traffic_logger.py              ← MongoDB writer (async)
│                                    ├─ Queue-based logging
│                                    ├─ Change detection
│                                    └─ Non-blocking persistence
│
├── database.py                    ← MongoDB connection
│                                    ├─ Connection pooling
│                                    ├─ TLS/SSL config
│                                    └─ Error handling
│
├── yolotest.py                    ← YOLO inference
│                                    ├─ Model loading
│                                    ├─ Detection
│                                    └─ GPU lock management
│
├── analytics.py                   ← Data queries
│                                    ├─ getHistory()
│                                    ├─ getTodaySummary()
│                                    ├─ getWeeklySummary()
│                                    └─ getMonthlySummary()
│
├── reports.py                     ← Report generation
│                                    ├─ buildPdfReport()
│                                    └─ buildCsvReport()
│
├── requirements.txt               ← Python dependencies
├── .env                          ← Config (MongoDB URI, DB name)
│
├── models/                        ← Trained AI models
│   ├── traffic_predictor.keras   ← LSTM model (TensorFlow)
│   ├── scaler.pkl                ← Data normalizer
│   └── README.md
│
├── prediction/                    ← ML pipeline
│   ├── predictor.py              ← Main prediction service
│   ├── lstm_model.py             ← Architecture definition
│   ├── train.py                  ← Training script (offline)
│   ├── preprocessing.py          ← Data normalization
│   ├── data_loader.py            ← Load historical data
│   ├── history_loader.py         ← Fetch recent history
│   ├── evaluation.py             ← Model metrics
│   ├── dataset.py                ← Dataset handling
│   ├── utils.py                  ← Helpers
│   └── __init__.py
│
├── tests/                         ← Unit tests
│   ├── test_analytics.py
│   ├── test_analytics_routes.py
│   ├── test_prediction_pipeline.py
│   ├── test_reports.py
│   └── test_historical_dataset.py
│
├── tools/                         ← Utility scripts
│   ├── generate_historical_dataset.py  ← Create training data
│   ├── import_historical_dataset.py    ← Load to DB
│   ├── check_tf_env.py                 ← Verify TF setup
│   ├── query_actual_vs_predicted.py    ← Validation
│   └── README.md
│
├── uploads/                       ← Processed uploads
│   ├── historical_traffic_dataset.csv
│   ├── phase1c_dataset_analysis.json
│   └── prediction_evaluation_metrics.json
│
├── yolov8n.pt                    ← YOLOv8 model file (230MB)
└── .gitignore
```

---

## 🔗 DATA FLOW CONNECTIONS

### **Real-time Traffic Processing Loop**
```
VIDEO INPUT
    ↓
WORKER THREADS (road1-4 concurrent)
    ├─ OpenCV: Read frame
    ├─ YOLO: Detect vehicles (shared GPU lock)
    ├─ Calculate: Density score
    ├─ Classify: Density level (LOW/MEDIUM/HIGH)
    ├─ Recommend: Green time (40s/60s/120s)
    ├─ LSTM: Predict next count (from prediction/predictor.py)
    ├─ Hybrid: Score = current*0.6 + predicted*0.4
    └─ STATE: Update shared_state.road_results[road_id]
        ↓
TRAFFIC CONTROLLER (1 instance)
    ├─ Read: All road_results
    ├─ Select: Road with MAX hybrid_score
    ├─ Compute: Waiting times for others
    └─ STATE: Update controller_state
        ├─ current_green_road
        ├─ current_timer
        └─ last_switch_time
        ↓
TRAFFIC LOGGER (background thread)
    ├─ Detect: State changes
    ├─ Queue: Log entry
    └─ MongoDB: Insert to traffic_logs collection
        ↓
FRONTEND (React polling every 500ms)
    ├─ API: GET /dashboard (from trafficApi.js)
    ├─ Response: road_summaries + controller_state
    └─ UI: Render RoadCard components
```

---

## 📊 API ENDPOINTS → FILE MAPPING

| Endpoint | Handler File | Function | Calls |
|----------|--------------|----------|-------|
| `GET /health` | `app.py` | Health check | Database connection test |
| `GET /dashboard` | `app.py` | Real-time state | Read from shared_state |
| `POST /upload` | `app.py` | Video upload | `worker.py` (set video_source) |
| `GET /analytics` | `app.py` | Historical data | `analytics.py` (MongoDB query) |
| `GET /reports/pdf` | `app.py` | PDF report | `reports.py` (PDF generation) |
| `GET /reports/csv` | `app.py` | CSV export | `reports.py` (CSV generation) |

---

## 🧵 Threading Architecture

```
Main Thread
└─ Flask App
   ├─ Request Handler (each request)
   │
   ├─ WORKER THREAD #1 (road1)
   │  ├─ Continuous loop: process_loop()
   │  ├─ Reads: video from uploads folder
   │  └─ Writes: road_results["road1"]
   │
   ├─ WORKER THREAD #2 (road2)
   │  └─ Same as #1
   │
   ├─ WORKER THREAD #3 (road3)
   │  └─ Same as #1
   │
   ├─ WORKER THREAD #4 (road4)
   │  └─ Same as #1
   │
   ├─ CONTROLLER THREAD (signal switching)
   │  ├─ Reads: road_results (all 4 roads)
   │  ├─ Runs: _select_green_road()
   │  ├─ Writes: controller_state
   │  └─ Logs: traffic_logger.log_snapshot()
   │
   └─ LOGGER THREAD (MongoDB writer)
      ├─ Reads: Queue from controller
      ├─ Writes: MongoDB collection
      └─ Non-blocking (async)

All threads synchronized with locks:
├─ controller_state_lock
├─ road_results_lock
└─ yolo_inference_lock (GPU access)
```

---

## 💾 DATABASE SCHEMA (MongoDB)

### **Collection: traffic_logs**
```json
{
  "_id": ObjectId(),
  "timestamp": ISODate("2024-01-15T10:30:45Z"),
  "road_name": "Road 1",
  "vehicle_count": 12,
  "density_level": "MEDIUM",
  "signal_status": "GREEN",
  "recommended_green_time": 60,
  "waiting_time": 45,
  "hybrid_score": 8.4,
  "predicted_vehicle_count": 14,
  "priority": 1
}
```

---

## 🎓 Key Formulas Used

### **1. Density Score**
```
density = vehicle_count / 30
Range: 0.0 (no traffic) to 1.0+ (heavy traffic)
```

### **2. Density Classification**
```
if density >= 0.67:
    level = "HIGH"      → Green: 120s
elif density >= 0.33:
    level = "MEDIUM"    → Green: 60s
else:
    level = "LOW"       → Green: 40s
```

### **3. Hybrid Score (60/40 Split)**
```
score = current_count × 0.6 + predicted_count × 0.4

Current: Real-time data (responsive)
Predicted: LSTM forecast (forward-looking)
```

### **4. Green Road Selection**
```
selected = max(
    [(score, road_id) for road_id, score in all_roads.items()],
    key = lambda x: (x[0], -road_number)
)
// Highest score wins, tie-break by lower road number
```

---

## 🚀 Execution Checklist for Presentation

### **What to highlight:**

✅ **4 concurrent workers** processing video feeds  
✅ **YOLO** detecting vehicles in real-time  
✅ **LSTM** predicting future traffic  
✅ **Hybrid algorithm** combining current + predicted  
✅ **Traffic controller** switching signals optimally  
✅ **MongoDB** logging all decisions  
✅ **React dashboard** displaying live state  
✅ **Thread-safe** operations with locks  
✅ **Scalable architecture** (can add more roads)  

---

## 🎯 For Your Presentation, Focus On:

1. **Show the system diagram** → How 4 workers, controller, and logger interact
2. **Explain the hybrid score** → 60% current, 40% predicted
3. **Demonstrate real-time flow** → Video → Detection → Prediction → Signal switching
4. **Highlight tech stack benefits**:
   - React: Modern, responsive UI
   - Flask: Lightweight, efficient API
   - YOLOv8: State-of-the-art detection
   - LSTM: Time-series forecasting
   - MongoDB: Flexible, scalable storage
5. **Show thread architecture** → Concurrent processing, thread-safe operations
6. **Display API structure** → Frontend ↔ Backend communication layer

---

*This document is your quick reference for mapping technologies to actual files and functions.*
