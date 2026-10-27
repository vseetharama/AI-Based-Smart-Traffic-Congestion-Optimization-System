# File Upload System - Setup Complete ✅

## Backend Status
✅ **Flask Server Running** on `http://localhost:5000`

### Files Created:
- `backend/app.py` - Flask API with file upload endpoint
- `backend/requirements.txt` - Python dependencies

### Flask Routes:
- **POST /upload** - Receives video files from frontend and saves them to `uploads/` folder
- **GET /health** - Health check endpoint

## Frontend Status
✅ **Upload Page Updated** with file upload functionality

### Changes Made:
- `src/pages/Upload.jsx` - Added upload handler and state management
- `src/components/UploadBox.jsx` - Updated with Tailwind styling

### Key Functions:
- `handleChange()` - Captures file selection
- `handleDrop()` - Handles drag & drop
- `handleUpload()` - Sends FormData to backend
- Loading state + error handling + success alerts

## Testing the Upload Feature

### Test 1: Validation (No Files)
1. Navigate to http://localhost:5174/upload
2. Click "Process Traffic Data" without selecting files
3. Expected: Alert shows "Please select at least one video" ✅

### Test 2: Upload with Files (Manual)
1. Click "Select Video" button on any road card
2. Choose a video file
3. File name appears below button (✅ prefix)
4. Click "Process Traffic Data"
5. Expected: Success alert + files saved to `backend/uploads/`

### Test 3: Check Backend Logs
- Flask server logs show upload details
- Example: `✅ road1: Saved as video.mp4`

## Folder Structure
```
backend/
├── app.py                 # Flask app
├── requirements.txt       # Dependencies
├── uploads/              # Auto-created on first upload
├── yolotest.py
├── yolov8n.pt
└── ...

frontend/
├── src/
│   ├── pages/
│   │   └── Upload.jsx   # Updated with upload handler
│   ├── components/
│   │   └── UploadBox.jsx # Updated with styling
│   └── ...
└── ...
```

## How It Works

### Frontend Flow:
1. User selects video files via file input or drag & drop
2. Files stored in React state (`videos` object)
3. Click "Process Traffic Data" → `handleUpload()` triggered
4. FormData created with files for road1, road2, road3, road4
5. POST request sent to `http://localhost:5000/upload`
6. Success/error alert shown to user
7. Files cleared on successful upload

### Backend Flow:
1. Flask receives POST request at `/upload` endpoint
2. Reads files from `request.files`
3. For each file (road1-4):
   - Secures filename with `secure_filename()`
   - Saves to `uploads/` folder
   - Logs to console
4. Returns JSON response with status

## Running the System

### Terminal 1 - Backend:
```powershell
cd backend
python.exe app.py
# Server runs on http://localhost:5000
```

### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
# Dev server runs on http://localhost:5174
```

## Features
✅ File validation (at least one file required)
✅ Drag & drop support
✅ Loading state (button disabled during upload)
✅ Error handling with user feedback
✅ Console logging for debugging
✅ CORS enabled for cross-origin requests
✅ Secure filename handling
✅ Max file size: 500 MB

## Troubleshooting

### Issue: Backend not responding
- Check Flask server is running: `http://localhost:5000/health`
- Verify CORS is enabled
- Check backend console for errors

### Issue: Files not saving
- Ensure `uploads/` folder exists (created automatically)
- Check file permissions
- Verify backend logs show successful save

### Issue: Upload fails silently
- Check browser console for errors (F12)
- Check Flask server console for error messages
- Ensure FormData is correctly formatted

## Next Steps (Optional)
- Add file type validation (video files only)
- Add file size limits
- Add progress bar for large uploads
- Process uploaded videos with YOLO
- Store metadata in database
