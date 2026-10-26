"""
J.A.R.V.I.S. Desktop Application Entrypoint
Redirects to unified main server engine.
"""
# type: ignore
import sys
import os

try:
    import mss  # type: ignore
except ImportError:
    pass

try:
    import screen_brightness_control  # type: ignore
except ImportError:
    pass

from main import main

if __name__ == "__main__":
    main()
