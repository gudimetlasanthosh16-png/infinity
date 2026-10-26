"""
Deck Builder helper functions for testing and rendering slide decks.
Re-exports diagram and benchmark chart generation functions from main.
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from main import generate_presentation_diagrams, generate_presentation_benchmark_chart
except ImportError:
    def generate_presentation_diagrams(topic, nodes=None, theme=None):
        return None

    def generate_presentation_benchmark_chart(topic, theme=None):
        return None

__all__ = [
    "generate_presentation_diagrams",
    "generate_presentation_benchmark_chart",
]
