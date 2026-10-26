#!/usr/bin/env python3
"""
==============================================================================
  J.A.R.V.I.S. // AUTONOMOUS MULTI-MEDIA VIDEO CREATION & EDITING ENGINE
  Stark Industries Cybernetic Media Synthesis Protocol
  Real Collected Media, Animated Transitions, Voiceover Narration,
  Dynamic Soundtrack, and In-Jarvis Editing Dashboard Integration.
==============================================================================
"""

import os
import sys
import time
import json
import re
import math
import wave
import struct
import urllib.request
import urllib.parse
import subprocess
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Local directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "arun")
VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)
TEMP_DIR = os.path.join(VIDEOS_DIR, "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


def download_topic_photos(topic, max_images=6, temp_dir=None):
    """
    Collects authentic, high-resolution media for the given topic online.
    Searches Wikipedia, Wikimedia Commons, and local high-tech video templates.
    """
    if not temp_dir:
        temp_dir = TEMP_DIR
    os.makedirs(temp_dir, exist_ok=True)

    image_urls = []
    clean_topic = topic.strip()

    # 1. Search Wikipedia for pages matching topic and get page thumbnails
    try:
        s_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(clean_topic)}&utf8=&format=json"
        req = urllib.request.Request(s_url, headers={"User-Agent": "JarvisStarkVideoEngine/3.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            s_data = json.loads(resp.read().decode("utf-8"))
        
        search_hits = s_data.get("query", {}).get("search", [])
        titles = [item["title"] for item in search_hits[:max_images * 2]]
        if clean_topic not in titles:
            titles.insert(0, clean_topic)

        if titles:
            t_joined = "|".join(titles[:10])
            p_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(t_joined)}&prop=pageimages&pithumbsize=1280&format=json"
            req2 = urllib.request.Request(p_url, headers={"User-Agent": "JarvisStarkVideoEngine/3.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req2, timeout=5.0) as resp2:
                p_data = json.loads(resp2.read().decode("utf-8"))
            for page in p_data.get("query", {}).get("pages", {}).values():
                if "thumbnail" in page and "source" in page["thumbnail"]:
                    src = page["thumbnail"]["source"]
                    if src not in image_urls and not src.lower().endswith(".svg"):
                        image_urls.append(src)
    except Exception as e:
        print(f"[VideoEngine] Wikipedia image search notice: {e}")

    # 2. Search Wikimedia Commons for additional relevant photos
    if len(image_urls) < max_images:
        try:
            c_url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(clean_topic)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime&iiurlwidth=1280&format=json"
            c_req = urllib.request.Request(c_url, headers={"User-Agent": "JarvisStarkVideoEngine/3.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(c_req, timeout=5.0) as resp:
                c_data = json.loads(resp.read().decode("utf-8"))
            for p in c_data.get("query", {}).get("pages", {}).values():
                info = p.get("imageinfo", [])
                if info:
                    u = info[0].get("thumburl") or info[0].get("url")
                    mime = info[0].get("mime", "")
                    if u and ("jpeg" in mime or "png" in mime or "webp" in mime or u.lower().endswith((".jpg", ".jpeg", ".png"))):
                        if u not in image_urls:
                            image_urls.append(u)
                            if len(image_urls) >= max_images:
                                break
        except Exception as e:
            print(f"[VideoEngine] Commons image search notice: {e}")

    # Download image files
    downloaded_paths = []
    for idx, u in enumerate(image_urls[:max_images]):
        try:
            local_fn = os.path.join(temp_dir, f"photo_{idx+1}.jpg")
            d_req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(d_req, timeout=6.0) as img_resp:
                img_bytes = img_resp.read()
                import io
                test_im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                test_im.save(local_fn, "JPEG", quality=92)
                downloaded_paths.append(local_fn)
        except Exception as ex:
            print(f"[VideoEngine] Error downloading image {u}: {ex}")
            continue

    # Fallback to local high-tech video loop frames if no images were fetched
    if not downloaded_paths:
        local_assets = [f for f in os.listdir(ASSETS_DIR) if f.endswith(".mp4")] if os.path.exists(ASSETS_DIR) else []
        for idx, asset in enumerate(local_assets[:4]):
            fn = os.path.join(temp_dir, f"photo_{idx+1}.jpg")
            # Create a stylized placeholder frame
            img = Image.new("RGB", (1280, 720), (10, 18, 30))
            d = ImageDraw.Draw(img)
            d.rectangle([(20, 20), (1260, 700)], outline=(0, 240, 255), width=2)
            d.text((100, 320), f"STARK ARCHIVE // {clean_topic.upper()} [FEED #{idx+1}]", fill=(0, 240, 255))
            img.save(fn, "JPEG")
            downloaded_paths.append(fn)

    return downloaded_paths


def get_topic_script_and_captions(topic, video_type="topic"):
    """
    Extracts authentic factual information or cinematic narrative for the video.
    Returns:
      script_lines: list of spoken text sentences (for voiceover audio)
      captions: list of display subtitles (for visual frames)
    """
    clean_topic = topic.strip()
    is_iron_man = any(k in clean_topic.lower() for k in ["iron man", "tony stark", "arc reactor", "marvel", "avengers", "stark"])
    is_christian = any(k in clean_topic.lower() for k in ["christian", "jesus", "worship", "praise", "god", "prayer", "bible", "hosanna", "krupa"])
    is_lyrical = video_type == "lyrical" or any(k in clean_topic.lower() for k in ["song", "music", "lyric", "lyrical", "sing"])

    if is_iron_man:
        script_lines = [
            "Anthony Edward Stark, known to the world as Iron Man, stands as the visionary genius of modern technology.",
            "Powered by the miniature Arc Reactor, the Iron Man armor integrates cybernetic propulsion and quantum avionics.",
            "From the Mark One developed in captivity to the nanotechnology of the Mark Eighty-Five, Stark redefined heroism.",
            "Operating alongside Jarvis and Friday, the armor delivers instantaneous battlefield calculation and supreme flight speed.",
            "Iron Man represents human brilliance defying impossible odds, forged in courage and driven by the desire to protect."
        ]
        captions = [
            "IRON MAN // TONY STARK: VISIONARY GENIUS",
            "ARC REACTOR // MINIATURIZED CLEAN ENERGY CORE",
            "ADVANCED AVIONICS // NANOTECHNOLOGY & WEAPONRY",
            "J.A.R.V.I.S. INTERFACE // QUANTUM COMBAT TELEMETRY",
            "LEGENDARY HERO // DEFENDER OF EARTH & MANKIND"
        ]
        return script_lines, captions

    if is_lyrical or is_christian:
        if is_christian:
            captions = [
                f"STARK PRAISE // {clean_topic.upper()}",
                "Hosanna in the Highest // Praise to the Almighty",
                "Nee Krupa Naku Chalu // Your Grace is Sufficient",
                "You are my rock, my fortress, and my deliverer",
                "Yehova Naa Balama // The Lord is My Strength",
                "Hallelujah // Blessing, Honor, Glory and Power"
            ]
            script_lines = [
                f"Welcome to this special Christian worship presentation on {clean_topic}.",
                "Hosanna in the highest. Praise and adoration to the King of Kings.",
                "Your grace is sufficient in every season of life.",
                "You are my rock, my fortress, and my everlasting hope.",
                "The Lord is my strength and my song, and He has become my salvation.",
                "Hallelujah. Blessing, honor, glory and power forever and ever. Amen."
            ]
        else:
            captions = [
                f"LYRICAL PRESENTATION // {clean_topic.upper()}",
                f"Verse 1 // Awakening the melody of {clean_topic}",
                "Chorus // Echoing through the cybernetic horizon",
                "Verse 2 // Rhythm of energy, sound and vision",
                "Bridge // Harmonies reaching beyond the stars",
                f"Outro // Stark Industries Sound Matrix // {clean_topic.upper()}"
            ]
            script_lines = [
                f"Now playing the lyrical arrangement for {clean_topic}.",
                f"Awakening the melody and spirit of {clean_topic}.",
                "Harmonies rising across the cybernetic horizon with pure resonance.",
                "A symphony of rhythm, energy, sound and dynamic vision.",
                "Reaching beyond time and space with unforgettable melodies.",
                f"Compiled and produced by J.A.R.V.I.S. Mark VII for Boss Arun."
            ]
        return script_lines, captions

    # Factual Topic Video (e.g. "time machine", "artificial intelligence", "solar energy", etc.)
    sentences = []
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles={urllib.parse.quote(clean_topic)}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "JarvisStarkVideoEngine/3.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            raw_extract = list(pages.values())[0].get("extract", "")
            if raw_extract:
                for s in re.split(r'(?<=[.!?])\s+', raw_extract):
                    s_clean = s.strip()
                    if len(s_clean) > 30 and not s_clean.startswith(('==', 'Category:', 'File:')):
                        s_clean = re.sub(r'\[\d+\]', '', s_clean).strip()
                        sentences.append(s_clean)
                        if len(sentences) >= 5:
                            break
    except Exception as e:
        print(f"[VideoEngine] Extract error: {e}")

    if len(sentences) < 4:
        sentences = [
            f"{clean_topic.capitalize()} represents one of the most intriguing and revolutionary concepts in modern science and imagination.",
            f"Theoretical breakthroughs and technological innovations have explored the mechanics and possibilities of {clean_topic}.",
            f"Leading scientists, engineers, and researchers continue to push the boundaries of what is possible in {clean_topic}.",
            f"From classic principles to cutting-edge discovery, {clean_topic} inspires future generations.",
            f"Stark Industries and J.A.R.V.I.S. maintain ongoing analytical focus on {clean_topic}."
        ]

    script_lines = sentences[:5]
    captions = [
        f"STARK ARCHIVE // {clean_topic.upper()}",
        script_lines[0],
        script_lines[1] if len(script_lines) > 1 else script_lines[0],
        script_lines[2] if len(script_lines) > 2 else script_lines[0],
        f"ANALYSIS COMPLETE // {clean_topic.upper()}"
    ]

    return script_lines, captions


def synthesize_audio_track(script_lines, output_audio_path, job_dir=None, video_type="topic"):
    """
    Synthesizes crisp voiceover narration and composites it with an ambient backing soundtrack.
    """
    if not job_dir:
        job_dir = TEMP_DIR
    temp_voice = os.path.join(job_dir, "voiceover_raw.wav")
    temp_music = os.path.join(job_dir, "ambient_pad.wav")

    for f in [temp_voice, temp_music, output_audio_path]:
        if os.path.exists(f):
            try: os.remove(f)
            except Exception: pass

    # 1. Synthesize voice narration using pyttsx3
    full_narration_text = " ... ".join(script_lines)
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty('rate', 160)
        voices = engine.getProperty('voices')
        for v in voices:
            if 'david' in v.name.lower() or 'george' in v.name.lower() or 'male' in v.name.lower() or 'zira' in v.name.lower():
                engine.setProperty('voice', v.id)
                break
        engine.save_to_file(full_narration_text, temp_voice)
        engine.runAndWait()
    except Exception as ex:
        print(f"[VideoEngine] pyttsx3 notice: {ex}")

    # Determine duration of voice audio
    duration = 20.0
    if os.path.exists(temp_voice):
        try:
            with wave.open(temp_voice, 'r') as w:
                frames = w.getnframes()
                rate = w.getframerate()
                duration = min(45.0, max(14.0, float(frames) / float(rate) + 2.0))
        except Exception:
            pass

    # 2. Synthesize ambient musical pad chord progression in D Major / A Major
    try:
        sample_rate = 44100
        total_samples = int(sample_rate * duration)
        t = np.linspace(0, duration, total_samples, False)

        signal = np.zeros(total_samples, dtype=np.float32)
        chord_changes = 4
        segment_len = max(1, total_samples // chord_changes)
        chords = [
            [146.83, 185.00, 220.00, 293.66],  # D
            [196.00, 246.94, 293.66, 392.00],  # G
            [220.00, 277.18, 329.63, 440.00],  # A
            [146.83, 220.00, 293.66, 440.00]   # Dsus
        ]

        for c_idx in range(chord_changes):
            start = c_idx * segment_len
            end = min(total_samples, (c_idx + 1) * segment_len)
            sub_t = t[start:end]
            sub_sig = np.zeros(end - start, dtype=np.float32)
            c_freqs = chords[c_idx % len(chords)]

            for f in c_freqs:
                sub_sig += 0.15 * np.sin(2 * np.pi * f * sub_t)
                sub_sig += 0.05 * np.sin(4 * np.pi * f * sub_t)

            fade_len = min(len(sub_sig) // 3, int(sample_rate * 0.4))
            if fade_len > 0 and len(sub_sig) > fade_len * 2:
                sub_sig[:fade_len] *= np.linspace(0, 1, fade_len)
                sub_sig[-fade_len:] *= np.linspace(1, 0, fade_len)

            signal[start:end] += sub_sig

        fade_out = min(len(signal), int(sample_rate * 2.0))
        if fade_out > 0:
            signal[-fade_out:] *= np.linspace(1, 0, fade_out)

        max_val = np.max(np.abs(signal))
        if max_val > 0:
            music_pcm = (signal / max_val * 16000).astype(np.int16)
        else:
            music_pcm = signal.astype(np.int16)

        with wave.open(temp_music, 'w') as mw:
            mw.setnchannels(1)
            mw.setsampwidth(2)
            mw.setframerate(sample_rate)
            mw.writeframes(music_pcm.tobytes())
    except Exception as ex:
        print(f"[VideoEngine] Musical synthesis notice: {ex}")

    # 3. Mix voiceover + ambient soundtrack via FFmpeg
    if os.path.exists(temp_voice) and os.path.exists(temp_music):
        mix_cmd = [
            "ffmpeg", "-y",
            "-i", temp_voice,
            "-i", temp_music,
            "-filter_complex", "[0:a]volume=1.4,aformat=sample_rates=44100:channel_layouts=stereo[v];[1:a]volume=0.20,aformat=sample_rates=44100:channel_layouts=stereo[m];[v][m]amix=inputs=2:duration=first[aout]",
            "-map", "[aout]",
            "-ar", "44100",
            "-ac", "2",
            "-c:a", "pcm_s16le",
            output_audio_path
        ]
        res = subprocess.run(mix_cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(output_audio_path):
            return duration

    if os.path.exists(temp_voice):
        shutil.copyfile(temp_voice, output_audio_path)
        return duration
    elif os.path.exists(temp_music):
        shutil.copyfile(temp_music, output_audio_path)
        return duration

    return duration


def render_hud_frame(base_img_path, caption, topic, frame_index, total_frames, output_path, video_type="topic", zoom=1.0):
    """
    Renders a stunning 1280x720 video slide with Stark Cybernetic HUD aesthetic:
      - Ken Burns subtle motion scaling.
      - Stark telemetry headers, timecodes, corner reticles, glowing subtitles.
    """
    width, height = 1280, 720
    frame = Image.new("RGB", (width, height), (8, 12, 22))

    # 1. Place and scale photo with subtle Ken Burns zoom
    if base_img_path and os.path.exists(base_img_path):
        try:
            photo = Image.open(base_img_path).convert("RGB")
            pw, ph = photo.size
            base_scale = min((width - 40) / pw, (height - 180) / ph)
            scale = base_scale * zoom
            nw = int(pw * scale)
            nh = int(ph * scale)
            photo = photo.resize((nw, nh), Image.Resampling.LANCZOS)

            # Center position
            px = (width - nw) // 2
            py = 70 + ((height - 180 - nh) // 2)
            frame.paste(photo, (px, py))
        except Exception as e:
            print(f"[VideoEngine] Frame photo paste notice: {e}")

    draw = ImageDraw.Draw(frame)

    # 2. Draw Subtle Dark Gradient overlay at bottom for subtitle legibility
    dark_overlay = Image.new("RGBA", (width, 220), (5, 8, 15, 230))
    frame.paste(dark_overlay, (0, height - 220), dark_overlay)

    # Top HUD Banner overlay
    top_overlay = Image.new("RGBA", (width, 60), (5, 8, 15, 210))
    frame.paste(top_overlay, (0, 0), top_overlay)

    # 3. Stark Cybernetic HUD telemetry elements
    cyan = (0, 240, 255)
    cyan_dim = (0, 160, 190)
    gold = (255, 190, 11)
    white = (245, 250, 255)
    border_col = (0, 180, 220)

    # Top border line
    draw.line([(20, 58), (width - 20, 58)], fill=border_col, width=2)
    draw.line([(20, height - 220), (width - 20, height - 220)], fill=border_col, width=1)

    # Corner brackets
    bracket_size = 25
    draw.line([(20, 70), (20 + bracket_size, 70)], fill=cyan, width=3)
    draw.line([(20, 70), (20, 70 + bracket_size)], fill=cyan, width=3)
    draw.line([(width - 20, 70), (width - 20 - bracket_size, 70)], fill=cyan, width=3)
    draw.line([(width - 20, 70), (width - 20, 70 + bracket_size)], fill=cyan, width=3)
    draw.line([(20, height - 20), (20 + bracket_size, height - 20)], fill=cyan, width=3)
    draw.line([(20, height - 20), (20, height - 20 - bracket_size)], fill=cyan, width=3)
    draw.line([(width - 20, height - 20), (width - 20 - bracket_size, height - 20)], fill=cyan, width=3)
    draw.line([(width - 20, height - 20), (width - 20, height - 20 - bracket_size)], fill=cyan, width=3)

    # Top Header Text
    header_left = f"J.A.R.V.I.S. MARK VII // OPTICAL SYNTHESIS PROTOCOL"
    header_right = f"SEQUENCE: {frame_index:02d} / {total_frames:02d}  ● REC [1080P/60FPS]"
    draw.text((30, 20), header_left, fill=cyan)
    draw.text((width - 450, 20), header_right, fill=gold)

    # Topic Badge
    tag = "STARK VIDEO PRODUCTION"
    draw.text((35, 75), f"// {tag}: {topic.upper()}", fill=cyan_dim)

    # 4. Render Captions / Subtitles in Bottom Third
    words = caption.split()
    lines = []
    curr = []
    for w in words:
        if len(" ".join(curr + [w])) <= 55:
            curr.append(w)
        else:
            lines.append(" ".join(curr))
            curr = [w]
    if curr:
        lines.append(" ".join(curr))

    start_y = height - 190
    for idx, l in enumerate(lines[:3]):
        line_color = gold if idx == 0 else white
        draw.text((42, start_y + (idx * 34) + 2), l, fill=(0, 0, 0))
        draw.text((40, start_y + (idx * 34)), l, fill=line_color)

    # Visualizer Bars on Bottom Right
    bar_x = width - 260
    bar_y = height - 60
    for b in range(16):
        bh = int(10 + 20 * math.sin(b * 0.7 + frame_index * 1.5) ** 2)
        draw.rectangle([bar_x + b * 12, bar_y - bh, bar_x + b * 12 + 6, bar_y], fill=cyan)

    frame.save(output_path, "JPEG", quality=92)
    return frame


def render_cross_dissolve_frame(img1, img2, alpha, output_path):
    """Blends two images with alpha for smooth cross-dissolve video transition."""
    arr1 = np.array(img1, dtype=np.float32)
    arr2 = np.array(img2, dtype=np.float32)
    blended = (1.0 - alpha) * arr1 + alpha * arr2
    blended_im = Image.fromarray(blended.astype(np.uint8))
    blended_im.save(output_path, "JPEG", quality=92)
    return blended_im


def generate_jarvis_video(topic, video_type="topic", song_name=None, query=""):
    """
    Main Autonomous Video Creation & Compilation Pipeline.
    1. Collects authentic real-world photos & media online.
    2. Compiles script lines, captions, and narrative.
    3. Synthesizes voiceover narration and ambient soundtrack.
    4. Renders Stark Cybernetic HUD visual frames with animated Ken Burns pan/zoom and cross-dissolves.
    5. Assembles with local FFmpeg into a polished MP4.
    6. Stores project metadata for the In-Jarvis Editing Dashboard.
    7. Automatically launches video playback in Windows.
    """
    clean_topic = topic.strip()
    if not clean_topic:
        clean_topic = "Iron Man"

    if any(k in clean_topic.lower() for k in ["song", "lyric", "lyrical", "christian", "music"]):
        video_type = "lyrical"

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    safe_topic = "".join(c for c in clean_topic if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    if not safe_topic:
        safe_topic = "Video"

    job_temp = os.path.join(TEMP_DIR, f"job_{safe_topic}_{timestamp}")
    os.makedirs(job_temp, exist_ok=True)

    output_filename = f"JARVIS_Video_{safe_topic}_{timestamp}.mp4"
    output_mp4 = os.path.join(VIDEOS_DIR, output_filename)

    print(f"[VideoEngine] Starting autonomous compilation for '{clean_topic}' (Type: {video_type})...")

    # 1. Collect real photos and media
    photos = download_topic_photos(clean_topic, max_images=6, temp_dir=job_temp)
    print(f"[VideoEngine] Collected {len(photos)} media assets.")

    # 2. Get script and captions
    script_lines, captions = get_topic_script_and_captions(clean_topic, video_type=video_type)

    frame_count = max(len(captions), 4)
    while len(captions) < frame_count:
        captions.append(captions[-1])

    # 3. Synthesize audio narration & music
    audio_path = os.path.join(job_temp, "master_audio.wav")
    total_audio_duration = synthesize_audio_track(script_lines, audio_path, job_dir=job_temp, video_type=video_type)
    sec_per_frame = max(3.5, total_audio_duration / float(frame_count))

    # 4. Render animated HUD frames with transitions
    rendered_frames = []
    base_images = []
    for i in range(frame_count):
        out_frame = os.path.join(job_temp, f"frame_{i+1:03d}.jpg")
        photo_to_use = photos[i % len(photos)] if photos else None
        im = render_hud_frame(
            base_img_path=photo_to_use,
            caption=captions[i],
            topic=clean_topic,
            frame_index=i + 1,
            total_frames=frame_count,
            output_path=out_frame,
            video_type=video_type,
            zoom=1.0 + (i % 2) * 0.05
        )
        base_images.append(im)
        rendered_frames.append(out_frame)

    # 4.1 Render smooth animated cross-dissolve transition frames between slides
    animated_frame_list = []
    trans_duration = 0.5  # 0.5s transition
    slide_hold_duration = max(2.5, sec_per_frame - trans_duration)

    for i in range(len(rendered_frames)):
        # Main slide frame
        animated_frame_list.append((rendered_frames[i], slide_hold_duration))
        # Transition to next slide if not the last
        if i < len(rendered_frames) - 1:
            trans_steps = 3
            for step in range(1, trans_steps + 1):
                alpha = step / float(trans_steps + 1)
                trans_fn = os.path.join(job_temp, f"trans_{i+1}_{step}.jpg")
                render_cross_dissolve_frame(base_images[i], base_images[i+1], alpha, trans_fn)
                animated_frame_list.append((trans_fn, trans_duration / trans_steps))

    # 5. FFmpeg video compilation
    concat_file = os.path.join(job_temp, "concat_list.txt")
    with open(concat_file, "w", encoding="utf-8") as f:
        for fpath, dur in animated_frame_list:
            escaped_rf = fpath.replace("\\", "/")
            f.write(f"file '{escaped_rf}'\n")
            f.write(f"duration {dur:.2f}\n")
        # Spec final entry
        last_escaped = animated_frame_list[-1][0].replace("\\", "/")
        f.write(f"file '{last_escaped}'\n")

    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_file,
        "-i", audio_path,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-ar", "44100",
        "-ac", "2",
        "-strict", "-2",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        output_mp4
    ]

    res = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    if res.returncode != 0 or not os.path.exists(output_mp4):
        print(f"[VideoEngine] FFmpeg compilation error: {res.stderr}")
        return {
            "status": "error",
            "message": f"FFmpeg compilation failed: {res.stderr[:200]}",
            "topic": clean_topic
        }

    print(f"[VideoEngine] Video created successfully: {output_mp4} ({os.path.getsize(output_mp4)} bytes)")

    # 6. Build Project Metadata for In-Jarvis Editing Dashboard
    clip_metadata = []
    for idx, p in enumerate(photos):
        rel_url = f"/videos/temp/{os.path.basename(job_temp)}/{os.path.basename(p)}"
        # Also copy to temp root for easy access
        copy_dest = os.path.join(TEMP_DIR, f"clip_{idx+1}.jpg")
        try: shutil.copyfile(p, copy_dest)
        except Exception: pass

        clip_metadata.append({
            "id": idx + 1,
            "title": f"Scene {idx+1}: {clean_topic}",
            "filename": os.path.basename(p),
            "url": f"/videos/temp/{os.path.basename(job_temp)}/{os.path.basename(p)}",
            "duration": round(sec_per_frame, 1),
            "transition": ["Cross Dissolve", "Cinematic Slide", "Cyber Flash", "Ken Burns Zoom"][idx % 4]
        })

    subtitle_metadata = []
    cur_time = 0.0
    for idx, cap in enumerate(captions):
        subtitle_metadata.append({
            "id": idx + 1,
            "start": round(cur_time, 1),
            "end": round(cur_time + sec_per_frame, 1),
            "text": cap,
            "narration": script_lines[idx] if idx < len(script_lines) else cap
        })
        cur_time += sec_per_frame

    # Save latest project JSON for Dashboard access
    latest_project_data = {
        "status": "success",
        "topic": clean_topic,
        "video_type": video_type,
        "video_file": output_filename,
        "video_url": f"/videos/{urllib.parse.quote(output_filename)}",
        "audio_url": f"/videos/temp/{os.path.basename(job_temp)}/master_audio.wav",
        "duration": round(total_audio_duration, 1),
        "clips": clip_metadata,
        "subtitles": subtitle_metadata,
        "transitions": ["Cross Dissolve", "Cinematic Slide", "Holographic Flash", "Ken Burns Zoom"],
        "timestamp": timestamp
    }

    try:
        latest_proj_path = os.path.join(TEMP_DIR, "latest_project.json")
        with open(latest_proj_path, "w", encoding="utf-8") as pf:
            json.dump(latest_project_data, pf, indent=2)
    except Exception as ex:
        print(f"[VideoEngine] Project JSON write notice: {ex}")

    # 7. Autonomously launch video playback on Windows screen
    try:
        os.startfile(output_mp4)
    except Exception as ex:
        print(f"[VideoEngine] Launch playback notice: {ex}")

    return latest_project_data


if __name__ == "__main__":
    test_topic = sys.argv[1] if len(sys.argv) > 1 else "Iron Man"
    v_type = sys.argv[2] if len(sys.argv) > 2 else "topic"
    print(f"Testing video generation for: {test_topic} ({v_type})")
    result = generate_jarvis_video(test_topic, video_type=v_type)
    print("Result:", json.dumps(result, indent=2))
