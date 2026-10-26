import os
import sys
import json
import time

sys.path.insert(0, r"c:\Users\mamat\ai model\arun\arun")

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

NOTES_DIR = r"c:\Users\mamat\ai model\arun\arun\notes"
ASSETS_DIR = os.path.join(NOTES_DIR, "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

from scratch.test_deck_builder import generate_presentation_diagrams, generate_presentation_benchmark_chart

diag_path = generate_presentation_diagrams("Quantum Mechanics")
chart_path = generate_presentation_benchmark_chart("Quantum Mechanics")

# Create mock 12-slide data
mock_deck = {
    "title": "QUANTUM MECHANICS",
    "subtitle": "Theoretical Formalism, Architectural Pipelines & Next-Gen Frontiers",
    "slides": []
}

for i in range(1, 13):
    layout = "standard"
    if i == 1:
        layout = "title"
    elif i == 4:
        layout = "diagram"
    elif i == 6:
        layout = "chart"
    elif i == 12:
        layout = "citations"

    mock_deck["slides"].append({
        "slide_num": i,
        "title": f"Phase {i}: Technical Analysis of Quantum Mechanics",
        "purpose": f"Systematic evaluation of key operational mechanisms in stage {i}",
        "layout": layout,
        "points": [
            f"Primary Benchmark {i}.1: High-fidelity parameter extraction across classical and quantum stacks.",
            f"Algorithmic Formalism {i}.2: Superposition state vectors demonstrate exponential compute scaling.",
            f"Operational Directive {i}.3: Fault-tolerant threshold mitigation verified via Stark telemetry."
        ],
        "highlight": f"EFFICIENCY GAIN: +{i*7}% OVER LEGACY SYSTEMS"
    })

def render_test_pdf(deck, diag, chart, pdf_path):
    c = canvas.Canvas(pdf_path, pagesize=(960, 540))
    total = len(deck["slides"])
    
    for s in deck["slides"]:
        # Background
        c.setFillColorHex("#070a13")
        c.rect(0, 0, 960, 540, fill=1, stroke=0)
        
        # Grid frame
        c.setStrokeColorHex("#101b33")
        c.setLineWidth(1)
        c.line(30, 30, 930, 30)
        c.line(30, 510, 930, 510)
        
        # Header
        c.setFillColorHex("#ffffff")
        c.setFont("Helvetica-Bold", 20)
        c.drawString(45, 475, s["title"][:55])
        
        c.setFillColorHex("#ffbe0b")
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(45, 455, f"PURPOSE // {s['purpose'][:80]}")
        
        c.setStrokeColorHex("#00f0ff")
        c.setLineWidth(2)
        c.line(45, 445, 915, 445)
        
        layout = s.get("layout", "standard")
        if layout == "diagram" and diag and os.path.exists(diag):
            # Top card
            c.setFillColorHex("#0d172e")
            c.setStrokeColorHex("#00a8cc")
            c.roundRect(45, 340, 870, 90, 6, fill=1, stroke=1)
            c.setFillColorHex("#e2e8f0")
            c.setFont("Helvetica", 11)
            for idx, p in enumerate(s["points"][:2]):
                c.drawString(60, 405 - idx*24, f"* {p[:95]}")
            # Diagram image
            c.drawImage(diag, 45, 75, width=870, height=250, preserveAspectRatio=True, anchor='c')
        elif layout == "chart" and chart and os.path.exists(chart):
            # Left card
            c.setFillColorHex("#0d172e")
            c.setStrokeColorHex("#00a8cc")
            c.roundRect(45, 75, 420, 350, 6, fill=1, stroke=1)
            c.setFillColorHex("#e2e8f0")
            c.setFont("Helvetica", 11)
            for idx, p in enumerate(s["points"]):
                c.drawString(60, 380 - idx*45, f"* {p[:45]}")
                c.drawString(72, 360 - idx*45, f"  {p[45:90]}")
            # Chart image
            c.drawImage(chart, 480, 75, width=435, height=350, preserveAspectRatio=True, anchor='c')
        else:
            # 2 large cards
            c.setFillColorHex("#0d172e")
            c.setStrokeColorHex("#00a8cc")
            c.roundRect(45, 75, 870, 350, 6, fill=1, stroke=1)
            c.setFillColorHex("#e2e8f0")
            c.setFont("Helvetica", 12)
            y_curr = 380
            for p in s["points"]:
                c.drawString(70, y_curr, f"- {p[:95]}")
                if len(p) > 95:
                    c.drawString(85, y_curr - 18, f"{p[95:190]}")
                    y_curr -= 18
                y_curr -= 40
            
            # Highlight badge
            c.setFillColorHex("#ffbe0b")
            c.setFont("Helvetica-Bold", 10)
            c.drawString(70, 105, f"[STARK TELEMETRY KEY HIGHLIGHT: {s.get('highlight', 'VERIFIED')}]")

        # Footer
        c.setFillColorHex("#556987")
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(45, 18, "STARK INDUSTRIES // AI RESEARCH MATRIX")
        c.drawString(400, 18, "CONFIDENTIAL // PREPARED FOR BOSS ARUN")
        c.setFillColorHex("#00f0ff")
        c.drawRightString(915, 18, f"SLIDE {s['slide_num']} OF {total}")
        
        c.showPage()
        
    c.save()
    print("PDF saved successfully:", pdf_path, os.path.exists(pdf_path))

def render_test_pptx(deck, diag, chart, pptx_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]
    total = len(deck["slides"])
    
    for s in deck["slides"]:
        slide = prs.slides.add_slide(blank_layout)
        
        # Dark Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = RGBColor(7, 10, 19)
        bg.line.color.rgb = RGBColor(16, 27, 51)
        
        # Title
        t_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(12.1), Inches(0.6))
        tf = t_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = s["title"]
        p.font.name = "Arial"
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        
        # Purpose
        pur_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.95), Inches(12.1), Inches(0.4))
        ptf = pur_box.text_frame
        pp = ptf.paragraphs[0]
        pp.text = f"PURPOSE // {s['purpose']}"
        pp.font.name = "Arial"
        pp.font.size = Pt(11)
        pp.font.italic = True
        pp.font.color.rgb = RGBColor(255, 190, 11)
        
        # Cyan divider
        div = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(1.35), Inches(12.1), Inches(0.04))
        div.fill.solid()
        div.fill.fore_color.rgb = RGBColor(0, 240, 255)
        div.line.fill.background()
        
        layout = s.get("layout", "standard")
        if layout == "diagram" and diag and os.path.exists(diag):
            slide.shapes.add_picture(diag, Inches(0.6), Inches(2.2), width=Inches(12.1))
        elif layout == "chart" and chart and os.path.exists(chart):
            slide.shapes.add_picture(chart, Inches(6.5), Inches(1.6), width=Inches(6.2))
            # Left points
            c_box = slide.shapes.add_textbox(Inches(0.6), Inches(1.6), Inches(5.6), Inches(5.0))
            ctf = c_box.text_frame
            ctf.word_wrap = True
            for pt in s["points"]:
                par = ctf.add_paragraph()
                par.text = f"• {pt}"
                par.font.size = Pt(13)
                par.font.color.rgb = RGBColor(226, 232, 240)
        else:
            c_box = slide.shapes.add_textbox(Inches(0.6), Inches(1.6), Inches(12.1), Inches(5.0))
            ctf = c_box.text_frame
            ctf.word_wrap = True
            for pt in s["points"]:
                par = ctf.add_paragraph()
                par.text = f"• {pt}"
                par.font.size = Pt(14)
                par.font.color.rgb = RGBColor(226, 232, 240)
                par.space_after = Pt(14)
                
    prs.save(pptx_path)
    print("PPTX saved successfully:", pptx_path, os.path.exists(pptx_path))

pdf_out = os.path.join(NOTES_DIR, "Test_Deck_12_Slides.pdf")
pptx_out = os.path.join(NOTES_DIR, "Test_Deck_12_Slides.pptx")
render_test_pdf(mock_deck, diag_path, chart_path, pdf_out)
render_test_pptx(mock_deck, diag_path, chart_path, pptx_out)
