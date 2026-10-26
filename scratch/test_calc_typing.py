import time
import win32gui
import win32con
import win32process
import win32com.client
import subprocess
import ctypes
import pyautogui

pyautogui.FAILSAFE = False

def automate_windows_calculator(expression_str):
    """
    Launches Windows Calculator, brings it to foreground focus,
    and visually types/clicks the arithmetic expression so the user
    sees the buttons being pressed in the Calculator UI.
    """
    # 1. Launch calculator
    subprocess.Popen("calc.exe")
    time.sleep(1.0)

    # 2. Find and activate Calculator window
    shell = win32com.client.Dispatch("WScript.Shell")
    hwnd = None
    
    for _ in range(5):
        # Try AppActivate first
        if shell.AppActivate("Calculator") or shell.AppActivate("calc"):
            time.sleep(0.3)
            hwnd = win32gui.GetForegroundWindow()
            break
        
        # Fallback to FindWindow
        hwnd = win32gui.FindWindow("ApplicationFrameWindow", "Calculator") or win32gui.FindWindow(None, "Calculator")
        if hwnd:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.SetForegroundWindow(hwnd)
            time.sleep(0.3)
            break
        time.sleep(0.4)

    # Ensure window is foreground
    if hwnd:
        try:
            ctypes.windll.user32.SetForegroundWindow(hwnd)
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        except Exception:
            pass

    time.sleep(0.4)

    # 3. Clean expression into keystrokes
    # e.g., '1000+2000' -> '1000', '+', '2000', '='
    clean_expr = expression_str.replace(' ', '').replace('×', '*').replace('÷', '/')
    print(f"[JARVIS Calc Automation] Typing expression '{clean_expr}' into Calculator...")

    for ch in clean_expr:
        if ch == '+':
            shell.SendKeys("{+}")
        elif ch == '-':
            shell.SendKeys("-")
        elif ch == '*':
            shell.SendKeys("*")
        elif ch == '/':
            shell.SendKeys("/")
        elif ch == '=':
            shell.SendKeys("{ENTER}")
        elif ch in '0123456789.()':
            shell.SendKeys(ch)
        time.sleep(0.18)

    # Send final Enter / Equals to complete calculation
    time.sleep(0.18)
    shell.SendKeys("{ENTER}")
    print("[JARVIS Calc Automation] Calculation keystroke sequence complete.")

if __name__ == "__main__":
    automate_windows_calculator("1000+2000")
