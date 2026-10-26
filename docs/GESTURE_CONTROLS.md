# Optical Gesture Telemetry & Control Suite

The **INFINITY // J.A.R.V.I.S. Mark VII** vision subsystem replaces physical mice and keyboards with zero-latency computer vision gestures detected via 21 3D hand landmarks.

---

## Gesture Directory & Technical Matrix

| ID | Gesture Name | Physical Pose | Target Landmarks | Trigger Condition | System Action | HUD Feedback |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Repulsor Palm Push** | Flat open palm pushed directly towards the camera; all 5 fingers spread. | WRIST, THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP | All 5 fingers extended; bounding box area increases $> 25\%$ | Master system mute (`pycaw`), halt active media & TTS vocal audio. | Concentric cyan energy blast ring radiates outwards with Stark charge-down chime. |
| **02** | **Holographic Pinch & Stretch** | Thumb and Index fingertip touch together, then expand or contract. | THUMB_TIP (4), INDEX_TIP (8) | $\|P_4 - P_8\| < \delta_{\text{pinch}}$ followed by $\Delta d$ expansion | Zoom in/out on active document, browser tab, or scale HUD. | Dynamic 3D wireframe bounding box with real-time magnification telemetry. |
| **03** | **Rotary Arc Volume Dial** | Index finger pointing up; trace a clockwise or counter-clockwise circle. | INDEX_TIP (8), INDEX_MCP (5) | Continuous angular delta $\Delta \theta$ around virtual anchor | Incremental master volume increase/decrease (1% per $15^\circ$). | Circular cyan/amber arc reactor dial sweeps with numeric decibel gauge. |
| **04** | **Repulsor Swipe Navigation** | Swift horizontal swipe of open flat hand across webcam field of view. | PALM_CENTER, WRIST (0) | Horizontal velocity $v_x > v_{\text{threshold}}$ over 4 frames | Next/Previous slide in presentation, switch browser tabs (`Ctrl+Tab`). | Cyan motion blur vector trail with directional arrow telemetry. |
| **05** | **Stealth Mode Cross-Fist** | Both hands raised in front of chest with closed fists crossed (`X`). | WRIST_L, WRIST_R, FIST_CONFIDENCE | Both fists closed; wrist distance $< 100\text{px}$ | Instantly locks Windows workstation (`LockWorkStation`), blacks out HUD. | Red Stark Industries lockdown banner: `"STEALTH PROTOCOL ACTIVATED"`. |
| **06** | **Air-Mouse Reticle & Virtual Click** | Index finger points as laser pointer; thumb tap on index MCP acts as click. | INDEX_TIP (8), THUMB_TIP (4) | Laser raycast tracking; $\|P_4 - P_5\| < 0.04$ | Smooth mouse cursor movement + Left/Right click trigger. | Glowing cyan targeting reticle with real-time screen coordinate readouts. |
| **07** | **Two-Finger Scroll Wave** | Index and Middle fingers extended side-by-side; wave up or down. | INDEX_TIP (8), MIDDLE_TIP (12) | Parallel vertical displacement $\Delta y$ | Smooth document / webpage vertical scrolling (`pyautogui`). | Dual vertical neon guide tracks with dynamic velocity pulse. |
| **08** | **Window Grab & Minimize** | Open hand in mid-air rapidly contracted into a tight fist. | ALL_TIPS $\to$ PALM_CENTER | Contraction ratio $< 0.4$ within 300ms | Minimizes active foreground window (`ShowWindowAsync(SW_MINIMIZE)`). | Holographic window collapse animation with vortex sound effect. |
| **09** | **Peace Sign Screenshot** | Index and Middle fingers in a "V" (peace sign); ring and pinky curled. | INDEX_TIP (8), MIDDLE_TIP (12), RING_TIP, PINKY_TIP | Index & Middle extended; angle between them $20^\circ-50^\circ$ | Captures high-res active screen region; indexes into `screenshots/`. | Screen flashes cyan camera shutter flash with thumbnail HUD preview. |
| **10** | **Thumbs Up Confirm** | Fist closed with Thumb raised vertically upward. | THUMB_TIP (4), THUMB_IP (3), FIST | Thumb pointing $> 60^\circ$ vertical; all other fingers curled | Confirms voice prompt (e.g. "Execute WhatsApp dispatch?"). | Green checkmark holographic badge with Stark chime. |

---

## Landmark Architecture & Reference Geometry

Each hand utilizes MediaPipe's 21 landmark topology:

```
        8   12  16  20
        |   |   |   |
    4   7   11  15  19
    \   |   |   |   |
     3  6   10  14  18
      \ |   |   |   /
       2 5   9   13 17
        \|___|___|/
             0 (Wrist)
```

### Tuning & Hysteresis

To eliminate false positives caused by natural hand tremors:
- **Spatial Smoothing**: Exponential moving average applied to landmark positions:
  $$\hat{P}_t = \alpha P_t + (1 - \alpha) \hat{P}_{t-1} \quad (\alpha = 0.65)$$
- **Activation Debounce**: Gestures must remain active for a minimum of $150\text{ms}$ before system action fires.
- **Cool-Down Window**: A 500ms refractory period prevents duplicate rapid-fire triggers for single-action gestures (like screenshots and stealth locks).
