# Windows Installation & Setup Guide

This guide covers installing and deploying **INFINITY // J.A.R.V.I.S. Mark VII** on Windows 10/11 workstations.

---

## 1. Prerequisites

- **Operating System**: Windows 10 (Build 19041+) or Windows 11 (64-bit recommended).
- **Python**: Version 3.10, 3.11, or 3.12 (Add Python to `PATH` during installation).
- **Hardware**:
  - HD Webcam (720p or 1080p for optical gesture tracking).
  - Microphone for voice command ingestion.
  - Dedicated or modern integrated GPU (DirectX 12 / OpenGL 3.3+ for HUD WebGL shaders).
- **Web Browser**: Microsoft Edge (or Edge WebView2 Runtime installed).

---

## 2. Installation Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/gudimetlasanthosh16-png/infinity.git
cd infinity
```

### Step 2: Create a Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Required Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure API Credentials
Copy `.env.example` to create your active `.env` file:
```powershell
copy .env.example .env
```
Open `.env` and set your OpenRouter API key:
```ini
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
```
*(Alternatively, place the raw key string directly inside `openrouter_key.txt`)*

---

## 3. Running J.A.R.V.I.S.

### Option A: Complete Desktop Application (PUI + Telemetry)
Run the launcher batch script or Python entry point:
```powershell
.\run_jarvis.bat
```
or
```powershell
python main.py
```

### Option B: Standalone HUD Demo
To preview the interactive cybernetic HUD animation without launching hardware telemetry or OpenCV camera capture:
1. Open [demo/index.html](file:///c:/Users/mamat/ai%20model/arun/arun/demo/index.html) directly in any modern web browser.
2. Click on the gesture simulation buttons to test HUD feedback in real time.

---

## 4. Troubleshooting & FAQ

### Issue: `ImportError: DLL load failed while importing win32api`
**Solution**: Re-run the pywin32 post-install script with Administrator privileges:
```powershell
python .\.venv\Scripts\pywin32_postinstall.py -install
```

### Issue: Camera not detected or black screen in optical telemetry
**Solution**:
1. Check Windows Privacy settings: `Settings > Privacy & security > Camera` and ensure "Let desktop apps access your camera" is enabled.
2. In `.env`, change `CAMERA_INDEX=0` to `CAMERA_INDEX=1` if using an external USB webcam.

### Issue: Edge WebView2 runtime missing
**Solution**: Download and install the Evergreen Bootstrapper from [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
