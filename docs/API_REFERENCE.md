# Telemetry & PUI API Reference

The local telemetry server embedded within `main.py` runs on `http://127.0.0.1:7777` by default. It provides bi-directional communication between the Python Windows automation runtime and the web-based Stark HUD.

---

## 1. REST Endpoints

### `GET /telemetry`
Returns real-time operating system hardware statistics, audio states, and computer vision status.

**Sample Response:**
```json
{
  "status": "online",
  "system": {
    "cpu_percent": 18.4,
    "memory_used_gb": 7.2,
    "memory_total_gb": 16.0,
    "memory_percent": 45.0,
    "battery_percent": 92,
    "power_plugged": true
  },
  "audio": {
    "master_volume": 65,
    "is_muted": false
  },
  "vision": {
    "fps": 60.1,
    "hands_detected": 1,
    "active_gesture": "None",
    "gesture_confidence": 0.88
  },
  "timestamp": 1788108920.45
}
```

---

### `POST /action`
Executes an immediate operating system or automation command.

**Request Payload:**
```json
{
  "action": "set_volume",
  "params": {
    "level": 75
  }
}
```

**Supported Actions:**
| Action Key | Parameter Object | Description |
| :--- | :--- | :--- |
| `set_volume` | `{"level": 0-100}` | Sets master output audio volume. |
| `toggle_mute` | `{}` | Toggles master system audio mute state. |
| `set_brightness` | `{"level": 0-100}` | Adjusts display backlight via DDC-CI. |
| `lock_workstation` | `{}` | Immediately locks the Windows PC. |
| `take_screenshot` | `{"format": "png"}` | Captures high-res screen and saves to `screenshots/`. |
| `generate_presentation` | `{"topic": "Quantum Computing", "slides": 10}` | Generates PowerPoint deck and matching PDF. |
| `whatsapp_dispatch` | `{"contact": "hx partner", "message": "Sync at 8 PM"}` | Dispatches WhatsApp 1-on-1 message without opening group chats. |

---

### `POST /llm`
Submits a query directly to the cognitive core for reasoning and multi-tool execution.

**Request Payload:**
```json
{
  "prompt": "JARVIS, summarize my recent quantum mechanics note and prepare a slide deck",
  "model": "google/gemini-2.0-flash-001",
  "temperature": 0.7
}
```

**Response Payload:**
```json
{
  "response": "Certainly, Boss. I have parsed the Quantum Mechanics dossier, generated a 10-slide PowerPoint presentation, and exported a high-resolution PDF to your notes vault.",
  "tools_executed": [
    "parse_local_note",
    "generate_pptx_deck",
    "convert_to_pdf"
  ],
  "latency_ms": 840
}
```

---

## 2. Audio & Voice Synthesizer Protocol

The speech engine utilizes Microsoft Edge's Neural Text-To-Speech backend via asynchronous websocket channels:

- **Voice Model**: `en-US-ChristopherNeural` (Default Stark Assistant persona)
- **Sample Rate**: 24,000 Hz, 16-bit mono PCM
- **Viseme & Pitch Stream**: Broadcasts real-time waveform packets to the HUD canvas to power the audio visualizer equalizer.
