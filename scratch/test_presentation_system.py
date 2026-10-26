import os
import sys
import re
import json
import time
import urllib.parse
import urllib.request
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTES_DIR = os.path.join(BASE_DIR, "notes")
ASSETS_DIR = os.path.join(NOTES_DIR, "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from reportlab.lib import colors as rl_colors
from reportlab.pdfgen import canvas as rl_canvas
from pptx import Presentation as PptxPresentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.shapes import MSO_SHAPE as PptxShape

PRESENTATION_THEMES = {
    "medical": {
        "id": "medical",
        "name": "Medical & Clinical Healthcare",
        "category_badge": "CLINICAL RESEARCH & BIOMEDICAL DOSSIER",
        "bg_hex": "#081b24",
        "card_hex": "#0f2c38",
        "border_hex": "#134e5e",
        "primary_hex": "#14b8a6",        # Crisp Teal
        "secondary_hex": "#38bdf8",      # Aquamarine Sky
        "text_title_hex": "#ffffff",
        "text_body_hex": "#e2e8f0",
        "text_muted_hex": "#94a3b8",
        "pptx_bg": PptxRGBColor(8, 27, 36),
        "pptx_card": PptxRGBColor(15, 44, 56),
        "pptx_border": PptxRGBColor(19, 78, 94),
        "pptx_primary": PptxRGBColor(20, 184, 166),
        "pptx_secondary": PptxRGBColor(56, 189, 248),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(226, 232, 240),
        "pptx_muted": PptxRGBColor(148, 163, 184),
        "logo_type": "medical_cross",
        "font_name": "Calibri"
    },
    "nature": {
        "id": "nature",
        "name": "Nature, Environment & Sustainability",
        "category_badge": "ENVIRONMENTAL & ECO INTELLIGENCE",
        "bg_hex": "#051f18",
        "card_hex": "#0a362b",
        "border_hex": "#115e4c",
        "primary_hex": "#10b981",        # Emerald Green
        "secondary_hex": "#34d399",      # Mint Leaf
        "text_title_hex": "#ffffff",
        "text_body_hex": "#f0fdf4",
        "text_muted_hex": "#86efac",
        "pptx_bg": PptxRGBColor(5, 31, 24),
        "pptx_card": PptxRGBColor(10, 54, 43),
        "pptx_border": PptxRGBColor(17, 94, 76),
        "pptx_primary": PptxRGBColor(16, 185, 129),
        "pptx_secondary": PptxRGBColor(52, 211, 153),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(240, 253, 244),
        "pptx_muted": PptxRGBColor(134, 239, 172),
        "logo_type": "leaf_globe",
        "font_name": "Segoe UI"
    },
    "finance": {
        "id": "finance",
        "name": "Finance, Economics & Corporate Strategy",
        "category_badge": "EXECUTIVE FINANCIAL & STRATEGIC BRIEFING",
        "bg_hex": "#081226",
        "card_hex": "#12203d",
        "border_hex": "#203a6b",
        "primary_hex": "#f59e0b",        # Prestige Gold
        "secondary_hex": "#fbbf24",      # Warm Amber
        "text_title_hex": "#ffffff",
        "text_body_hex": "#f8fafc",
        "text_muted_hex": "#cbd5e1",
        "pptx_bg": PptxRGBColor(8, 18, 38),
        "pptx_card": PptxRGBColor(18, 32, 61),
        "pptx_border": PptxRGBColor(32, 58, 107),
        "pptx_primary": PptxRGBColor(245, 158, 11),
        "pptx_secondary": PptxRGBColor(251, 191, 36),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(248, 250, 252),
        "pptx_muted": PptxRGBColor(203, 213, 225),
        "logo_type": "finance_growth",
        "font_name": "Arial"
    },
    "ai_tech": {
        "id": "ai_tech",
        "name": "Artificial Intelligence & Advanced Technology",
        "category_badge": "APPLIED COMPUTATIONAL & AI INTELLIGENCE",
        "bg_hex": "#090d16",
        "card_hex": "#141c2e",
        "border_hex": "#283556",
        "primary_hex": "#6366f1",        # Electric Indigo
        "secondary_hex": "#38bdf8",      # Cyan Light
        "text_title_hex": "#ffffff",
        "text_body_hex": "#e0e7ff",
        "text_muted_hex": "#94a3b8",
        "pptx_bg": PptxRGBColor(9, 13, 22),
        "pptx_card": PptxRGBColor(20, 28, 46),
        "pptx_border": PptxRGBColor(40, 53, 86),
        "pptx_primary": PptxRGBColor(99, 102, 241),
        "pptx_secondary": PptxRGBColor(56, 189, 248),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(224, 231, 255),
        "pptx_muted": PptxRGBColor(148, 163, 184),
        "logo_type": "ai_chip",
        "font_name": "Segoe UI"
    },
    "space": {
        "id": "space",
        "name": "Aerospace, Astronomy & Astrophysics",
        "category_badge": "AEROSPACE & ASTROPHYSICAL MONOGRAPH",
        "bg_hex": "#030612",
        "card_hex": "#0c1329",
        "border_hex": "#1d2b56",
        "primary_hex": "#818cf8",        # Cosmic Violet
        "secondary_hex": "#38bdf8",      # Starlight Cyan
        "text_title_hex": "#ffffff",
        "text_body_hex": "#f1f5f9",
        "text_muted_hex": "#94a3b8",
        "pptx_bg": PptxRGBColor(3, 6, 18),
        "pptx_card": PptxRGBColor(12, 19, 41),
        "pptx_border": PptxRGBColor(29, 43, 86),
        "pptx_primary": PptxRGBColor(129, 140, 248),
        "pptx_secondary": PptxRGBColor(56, 189, 248),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(241, 245, 249),
        "pptx_muted": PptxRGBColor(148, 163, 184),
        "logo_type": "space_orbit",
        "font_name": "Trebuchet MS"
    },
    "engineering": {
        "id": "engineering",
        "name": "Engineering, Mechanics & Industry",
        "category_badge": "INDUSTRIAL ARCHITECTURE & ENGINEERING",
        "bg_hex": "#121316",
        "card_hex": "#20232a",
        "border_hex": "#383d47",
        "primary_hex": "#ef4444",        # Precision Red
        "secondary_hex": "#f97316",      # Flame Orange
        "text_title_hex": "#ffffff",
        "text_body_hex": "#f4f4f5",
        "text_muted_hex": "#a1a1aa",
        "pptx_bg": PptxRGBColor(18, 19, 22),
        "pptx_card": PptxRGBColor(32, 35, 42),
        "pptx_border": PptxRGBColor(56, 61, 71),
        "pptx_primary": PptxRGBColor(239, 68, 68),
        "pptx_secondary": PptxRGBColor(249, 115, 22),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(244, 244, 245),
        "pptx_muted": PptxRGBColor(161, 161, 170),
        "logo_type": "gear_tech",
        "font_name": "Arial"
    },
    "academic": {
        "id": "academic",
        "name": "Scholarly, History & Humanities",
        "category_badge": "ACADEMIC MONOGRAPH & SCHOLARLY DISCOURSE",
        "bg_hex": "#181310",
        "card_hex": "#291e19",
        "border_hex": "#4a352c",
        "primary_hex": "#d97706",        # Scholarly Amber
        "secondary_hex": "#f59e0b",      # Warm Gold
        "text_title_hex": "#ffffff",
        "text_body_hex": "#fffbeb",
        "text_muted_hex": "#d6d3d1",
        "pptx_bg": PptxRGBColor(24, 19, 16),
        "pptx_card": PptxRGBColor(41, 30, 25),
        "pptx_border": PptxRGBColor(74, 53, 44),
        "pptx_primary": PptxRGBColor(217, 119, 6),
        "pptx_secondary": PptxRGBColor(245, 158, 11),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(255, 251, 235),
        "pptx_muted": PptxRGBColor(214, 211, 209),
        "logo_type": "academic_crest",
        "font_name": "Georgia"
    },
    "creative": {
        "id": "creative",
        "name": "Creative Studio & Brand Pitch",
        "category_badge": "CREATIVE STRATEGY & BRAND MASTERPLAN",
        "bg_hex": "#160824",
        "card_hex": "#2d1247",
        "border_hex": "#58218a",
        "primary_hex": "#f43f5e",        # Neon Rose
        "secondary_hex": "#a855f7",      # Electric Purple
        "text_title_hex": "#ffffff",
        "text_body_hex": "#fdf4ff",
        "text_muted_hex": "#f0abfc",
        "pptx_bg": PptxRGBColor(22, 8, 36),
        "pptx_card": PptxRGBColor(45, 18, 71),
        "pptx_border": PptxRGBColor(88, 33, 138),
        "pptx_primary": PptxRGBColor(244, 63, 94),
        "pptx_secondary": PptxRGBColor(168, 85, 247),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(253, 244, 255),
        "pptx_muted": PptxRGBColor(240, 171, 252),
        "logo_type": "creative_prism",
        "font_name": "Calibri"
    },
    "corporate": {
        "id": "corporate",
        "name": "Modern Executive Universal",
        "category_badge": "STRATEGIC EXECUTIVE COMPENDIUM",
        "bg_hex": "#0f172a",
        "card_hex": "#1e293b",
        "border_hex": "#334155",
        "primary_hex": "#2563eb",        # Royal Cobalt
        "secondary_hex": "#60a5fa",      # Sky Accent
        "text_title_hex": "#ffffff",
        "text_body_hex": "#f8fafc",
        "text_muted_hex": "#94a3b8",
        "pptx_bg": PptxRGBColor(15, 23, 42),
        "pptx_card": PptxRGBColor(30, 41, 59),
        "pptx_border": PptxRGBColor(51, 65, 85),
        "pptx_primary": PptxRGBColor(37, 99, 235),
        "pptx_secondary": PptxRGBColor(96, 165, 250),
        "pptx_white": PptxRGBColor(255, 255, 255),
        "pptx_body": PptxRGBColor(248, 250, 252),
        "pptx_muted": PptxRGBColor(148, 163, 184),
        "logo_type": "corporate_shield",
        "font_name": "Arial"
    }
}

def select_topic_presentation_theme(topic: str):
    t = topic.lower().strip()
    if any(k in t for k in ["med", "health", "biolog", "pharma", "doctor", "pathology", "clinic", "disease", "genet", "surgery", "cancer", "neuro", "vaccine", "dna", "cardio", "hospital", "patient"]):
        return PRESENTATION_THEMES["medical"]
    elif any(k in t for k in ["natur", "environ", "ecolog", "forest", "agricultur", "climat", "renewabl", "solar", "ocean", "anim", "wildlif", "plant", "sustainab", "green", "earth", "water", "tree"]):
        return PRESENTATION_THEMES["nature"]
    elif any(k in t for k in ["financ", "stock", "market", "econom", "invest", "bank", "crypto", "bitcoin", "business", "startup", "ventur", "portfoli", "commerc", "trade", "account", "revenu", "profit", "wealth"]):
        return PRESENTATION_THEMES["finance"]
    elif any(k in t for k in ["space", "univers", "astronom", "galaxy", "planet", "mars", "moon", "rocket", "nasa", "astrophys", "cosmo", "star", "satellit", "orbit", "telescop"]):
        return PRESENTATION_THEMES["space"]
    elif any(k in t for k in ["engin", "mechanic", "automot", "car", "vehicl", "motor", "aerospac", "construct", "architect", "civil", "electr", "manufactur", "industr", "machin", "robotic"]):
        return PRESENTATION_THEMES["engineering"]
    elif any(k in t for k in ["histori", "literatur", "philosoph", "psycholog", "educat", "universit", "languag", "govern", "law", "art", "societ", "cultur", "civiliz", "ancient", "war", "book"]):
        return PRESENTATION_THEMES["academic"]
    elif any(k in t for k in ["creativ", "design", "market", "media", "music", "fashion", "entertain", "film", "brand", "advertis", "photo", "cinema", "song", "video"]):
        return PRESENTATION_THEMES["creative"]
    elif any(k in t for k in ["ai", "artific", "intellig", "learn", "neural", "deep", "softwar", "python", "comput", "cyber", "cloud", "data", "algorithm", "code", "coding", "tech", "quantum", "network"]):
        return PRESENTATION_THEMES["ai_tech"]
    return PRESENTATION_THEMES["corporate"]

def get_or_create_theme_logo(theme, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    theme_id = theme.get("id", "corporate")
    logo_path = os.path.join(out_dir, f"theme_logo_{theme_id}.png")
    if os.path.exists(logo_path):
        return logo_path

    try:
        size = 256
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        p_rgb = theme["pptx_primary"]
        s_rgb = theme["pptx_secondary"]
        c_rgb = theme["pptx_card"]

        # Outer ring
        draw.ellipse([8, 8, size - 8, size - 8], fill=(c_rgb[0], c_rgb[1], c_rgb[2], 240), outline=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=6)
        draw.ellipse([22, 22, size - 22, size - 22], outline=(s_rgb[0], s_rgb[1], s_rgb[2], 160), width=2)

        l_type = theme.get("logo_type", "corporate_shield")
        if l_type == "medical_cross":
            draw.rectangle([112, 60, 144, 196], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
            draw.rectangle([60, 112, 196, 144], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
            draw.ellipse([116, 116, 140, 140], fill=(255, 255, 255, 255))
        elif l_type == "leaf_globe":
            draw.pieslice([64, 64, 192, 192], 200, 20, fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
            draw.pieslice([64, 64, 192, 192], 20, 200, fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            draw.line([128, 64, 128, 192], fill=(255, 255, 255, 255), width=4)
        elif l_type == "finance_growth":
            draw.rectangle([64, 140, 92, 190], fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            draw.rectangle([106, 110, 134, 190], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
            draw.rectangle([148, 70, 176, 190], fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            draw.line([64, 130, 180, 56], fill=(255, 255, 255, 255), width=5)
            draw.polygon([(185, 52), (160, 52), (185, 78)], fill=(255, 255, 255, 255))
        elif l_type == "space_orbit":
            draw.ellipse([108, 108, 148, 148], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
            draw.arc([40, 90, 216, 166], 0, 360, fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255), width=4)
            draw.arc([70, 50, 186, 206], 0, 360, fill=(255, 255, 255, 200), width=3)
        elif l_type == "gear_tech":
            draw.ellipse([88, 88, 168, 168], outline=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=18)
            draw.ellipse([114, 114, 142, 142], fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            for ang in [0, 45, 90, 135, 180, 225, 270, 315]:
                rad = ang * 3.14159 / 180
                cx = int(128 + 68 * (1 if abs(ang-90)>40 else 0))
                cy = int(128 + 68 * (1 if abs(ang-180)>40 else 0))
                draw.rectangle([cx-6, cy-6, cx+6, cy+6], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255))
        elif l_type == "academic_crest":
            draw.polygon([(128, 48), (200, 90), (180, 170), (128, 208), (76, 170), (56, 90)], outline=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=5)
            draw.rectangle([100, 110, 156, 160], fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            draw.line([128, 110, 128, 160], fill=(c_rgb[0], c_rgb[1], c_rgb[2], 255), width=3)
        else: # ai_chip / corporate_shield
            draw.rectangle([80, 80, 176, 176], outline=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=6, fill=(c_rgb[0], c_rgb[1], c_rgb[2], 255))
            draw.rectangle([104, 104, 152, 152], fill=(s_rgb[0], s_rgb[1], s_rgb[2], 255))
            for offset in [100, 128, 156]:
                draw.line([offset, 54, offset, 80], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=3)
                draw.line([offset, 176, offset, 202], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=3)
                draw.line([54, offset, 80, offset], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=3)
                draw.line([176, offset, 202, offset], fill=(p_rgb[0], p_rgb[1], p_rgb[2], 255), width=3)

        img.save(logo_path, "PNG")
        return logo_path
    except Exception as e:
        print("[Logo Gen Notice]:", e)
        return None

print("Theme Engine Loaded Successfully!")
topic_sample = "Artificial Intelligence"
theme = select_topic_presentation_theme(topic_sample)
print(f"Selected Theme for '{topic_sample}': {theme['name']}")
logo = get_or_create_theme_logo(theme, ASSETS_DIR)
print(f"Generated Logo: {logo}, Exists: {os.path.exists(logo)}")
