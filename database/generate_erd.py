#!/usr/bin/env python3
"""
ERD Generator for PresenceAI Attendance System
Generates a high-resolution, modern dark-themed Entity-Relationship Diagram (ERD.png)
using Pillow (PIL).
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_erd():
    WIDTH = 2500
    HEIGHT = 1600
    img = Image.new("RGB", (WIDTH, HEIGHT), "#0b1329")
    draw = ImageDraw.Draw(img)

    # Try loading fonts, fallback to default if not available
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 36)
        font_subtitle = ImageFont.truetype("arial.ttf", 18)
        font_tbl_header = ImageFont.truetype("arialbd.ttf", 20)
        font_col = ImageFont.truetype("arial.ttf", 15)
        font_col_bold = ImageFont.truetype("arialbd.ttf", 15)
        font_col_type = ImageFont.truetype("consola.ttf", 13)
        font_badge = ImageFont.truetype("arialbd.ttf", 11)
        font_rel = ImageFont.truetype("arialbd.ttf", 13)
    except IOError:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_tbl_header = ImageFont.load_default()
        font_col = ImageFont.load_default()
        font_col_bold = ImageFont.load_default()
        font_col_type = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_rel = ImageFont.load_default()

    # Draw Background Grid Accent
    for x in range(0, WIDTH, 50):
        draw.line([(x, 0), (x, HEIGHT)], fill="#111d38", width=1)
    for y in range(0, HEIGHT, 50):
        draw.line([(0, y), (WIDTH, y)], fill="#111d38", width=1)

    # Header Title Banner
    draw.rectangle([(50, 40), (WIDTH - 50, 120)], fill="#152238", outline="#2b3e66", width=2)
    draw.text((80, 52), "PresenceAI — Database Entity-Relationship Diagram (ERD)", fill="#ffffff", font=font_title)
    draw.text((80, 94), "PostgreSQL 13+ Schema | AI Attendance Verification with Dynamic QR, Geofence & Evidence Pipeline", fill="#94a3b8", font=font_subtitle)

    # Table Schema Definitions: (name, x, y, width, header_color, columns)
    # columns: [(name, type, constraint_badge, is_pk, is_fk)]
    tables = [
        {
            "id": "users",
            "name": "users",
            "title": "users (Account & Auth)",
            "x": 80,
            "y": 180,
            "w": 380,
            "color": "#3b82f6",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("username", "VARCHAR(50)", "UNIQUE", False, False),
                ("email", "VARCHAR(255)", "UNIQUE", False, False),
                ("password_hash", "VARCHAR(255)", "NOT NULL", False, False),
                ("full_name", "VARCHAR(100)", "NOT NULL", False, False),
                ("role", "VARCHAR(20)", "CHECK", False, False),
                ("is_active", "BOOLEAN", "DEFAULT true", False, False),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("updated_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
        {
            "id": "classes",
            "name": "classes",
            "title": "classes (Course & Geofence)",
            "x": 580,
            "y": 180,
            "w": 410,
            "color": "#6366f1",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("class_code", "VARCHAR(50)", "UNIQUE", False, False),
                ("class_name", "VARCHAR(150)", "NOT NULL", False, False),
                ("room", "VARCHAR(100)", "NOT NULL", False, False),
                ("latitude", "DECIMAL(10,8)", "NOT NULL", False, False),
                ("longitude", "DECIMAL(11,8)", "NOT NULL", False, False),
                ("geofence_radius_meters", "INT", "DEFAULT 50", False, False),
                ("coach_id", "UUID", "FK -> users.id", False, True),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("updated_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
        {
            "id": "students",
            "name": "students",
            "title": "students (Enrolled Profile)",
            "x": 80,
            "y": 620,
            "w": 380,
            "color": "#10b981",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("user_id", "UUID", "FK -> users.id", False, True),
                ("student_code", "VARCHAR(50)", "UNIQUE", False, False),
                ("full_name", "VARCHAR(100)", "NOT NULL", False, False),
                ("email", "VARCHAR(255)", "UNIQUE", False, False),
                ("enrolled_device_id", "VARCHAR(255)", "NULLABLE", False, False),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("updated_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
        {
            "id": "class_students",
            "name": "class_students",
            "title": "class_students (Enrollment M:N)",
            "x": 580,
            "y": 620,
            "w": 410,
            "color": "#8b5cf6",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("class_id", "UUID", "FK -> classes.id", False, True),
                ("student_id", "UUID", "FK -> students.id", False, True),
                ("joined_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("CONSTRAINT", "UNIQUE", "(class_id, student_id)", False, False),
            ]
        },
        {
            "id": "attendance_sessions",
            "name": "attendance_sessions",
            "title": "attendance_sessions (Dynamic QR)",
            "x": 1120,
            "y": 180,
            "w": 440,
            "color": "#ec4899",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("class_id", "UUID", "FK -> classes.id", False, True),
                ("session_name", "VARCHAR(150)", "NOT NULL", False, False),
                ("qr_secret_key", "VARCHAR(255)", "SECRET HMAC", False, False),
                ("current_qr_token", "VARCHAR(255)", "ROTATING TOKEN", False, False),
                ("qr_rotation_interval_seconds", "INT", "DEFAULT 45s", False, False),
                ("start_time", "TIMESTAMPTZ", "NOT NULL", False, False),
                ("end_time", "TIMESTAMPTZ", "NULLABLE", False, False),
                ("status", "VARCHAR(20)", "ACTIVE|CLOSED", False, False),
                ("created_by", "UUID", "FK -> users.id", False, True),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("updated_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
        {
            "id": "attendance_records",
            "name": "attendance_records",
            "title": "attendance_records (AI Scoring & Verdict)",
            "x": 1690,
            "y": 180,
            "w": 450,
            "color": "#f59e0b",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("session_id", "UUID", "FK -> sessions.id", False, True),
                ("student_id", "UUID", "FK -> students.id", False, True),
                ("check_in_time", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("ai_verdict", "VARCHAR(20)", "CONFIRMED|VERIFY|SUSP", False, False),
                ("ai_confidence", "INT", "0 - 100", False, False),
                ("ai_reasoning", "TEXT", "LLM EXPLANATION", False, False),
                ("coach_status", "VARCHAR(20)", "PENDING|APPROVED", False, False),
                ("coach_note", "TEXT", "NULLABLE", False, False),
                ("reviewed_by", "UUID", "FK -> users.id", False, True),
                ("reviewed_at", "TIMESTAMPTZ", "NULLABLE", False, False),
                ("CONSTRAINT", "UNIQUE", "(session_id, student_id)", False, False),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
                ("updated_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
        {
            "id": "attendance_evidence",
            "name": "attendance_evidence",
            "title": "attendance_evidence (Multimodal Signals)",
            "x": 1690,
            "y": 800,
            "w": 450,
            "color": "#06b6d4",
            "columns": [
                ("id", "UUID", "PK", True, False),
                ("record_id", "UUID", "FK -> records.id", False, True),
                ("client_timestamp", "TIMESTAMPTZ", "NOT NULL", False, False),
                ("time_offset_seconds", "INT", "± SECONDS", False, False),
                ("latitude", "DECIMAL(10,8)", "NULLABLE", False, False),
                ("longitude", "DECIMAL(11,8)", "NULLABLE", False, False),
                ("gps_accuracy", "DECIMAL(8,2)", "METERS (±)", False, False),
                ("distance_to_room_meters", "DECIMAL(8,2)", "HAVERSINE DIST", False, False),
                ("qr_token_submitted", "VARCHAR(255)", "CHECK REPLAY", False, False),
                ("qr_validity", "BOOLEAN", "VALID / EXPIRED", False, False),
                ("device_fingerprint", "VARCHAR(255)", "DEVICE HASH", False, False),
                ("device_matched", "BOOLEAN", "MATCH ENROLLED", False, False),
                ("ip_address", "VARCHAR(45)", "IPv4 / IPv6", False, False),
                ("user_agent", "TEXT", "BROWSER INFO", False, False),
                ("raw_metadata", "JSONB", "EXTENSIBLE DATA", False, False),
                ("created_at", "TIMESTAMPTZ", "DEFAULT now", False, False),
            ]
        },
    ]

    # Calculate Table Heights & Render Tables
    table_bounds = {}
    ROW_HEIGHT = 30
    HEADER_HEIGHT = 44

    for tbl in tables:
        col_count = len(tbl["columns"])
        tbl_h = HEADER_HEIGHT + col_count * ROW_HEIGHT + 14
        table_bounds[tbl["id"]] = {
            "x1": tbl["x"],
            "y1": tbl["y"],
            "x2": tbl["x"] + tbl["w"],
            "y2": tbl["y"] + tbl_h,
            "w": tbl["w"],
            "h": tbl_h,
            "color": tbl["color"],
            "col_y": {}
        }

        # Card shadow & background
        draw.rectangle(
            [(tbl["x"] + 6, tbl["y"] + 6), (tbl["x"] + tbl["w"] + 6, tbl["y"] + tbl_h + 6)],
            fill="#050914"
        )
        draw.rectangle(
            [(tbl["x"], tbl["y"]), (tbl["x"] + tbl["w"], tbl["y"] + tbl_h)],
            fill="#152238",
            outline="#2a3d5e",
            width=2
        )

        # Header Box
        draw.rectangle(
            [(tbl["x"], tbl["y"]), (tbl["x"] + tbl["w"], tbl["y"] + HEADER_HEIGHT)],
            fill=tbl["color"]
        )
        draw.text(
            (tbl["x"] + 16, tbl["y"] + 11),
            tbl["title"],
            fill="#ffffff",
            font=font_tbl_header
        )

        # Columns
        cur_y = tbl["y"] + HEADER_HEIGHT + 6
        for idx, (col_name, col_type, badge, is_pk, is_fk) in enumerate(tbl["columns"]):
            table_bounds[tbl["id"]]["col_y"][col_name] = cur_y + ROW_HEIGHT // 2

            # Alternating row background
            if idx % 2 == 1:
                draw.rectangle(
                    [(tbl["x"] + 2, cur_y), (tbl["x"] + tbl["w"] - 2, cur_y + ROW_HEIGHT)],
                    fill="#1a2942"
                )

            # Icon / Key symbol
            icon = "🔑 " if is_pk else ("🔗 " if is_fk else "• ")
            icon_color = "#facc15" if is_pk else ("#60a5fa" if is_fk else "#64748b")
            draw.text((tbl["x"] + 12, cur_y + 6), icon, fill=icon_color, font=font_col_bold)

            # Col name
            name_color = "#ffffff" if (is_pk or is_fk) else "#e2e8f0"
            draw.text((tbl["x"] + 42, cur_y + 6), col_name, fill=name_color, font=font_col_bold if (is_pk or is_fk) else font_col)

            # Col Type
            draw.text((tbl["x"] + 210, cur_y + 8), col_type, fill="#94a3b8", font=font_col_type)

            # Badge
            badge_x = tbl["x"] + tbl["w"] - 120
            draw.rectangle([(badge_x, cur_y + 5), (tbl["x"] + tbl["w"] - 14, cur_y + 23)], fill="#22324e", outline="#3b4f73")
            draw.text((badge_x + 6, cur_y + 7), badge, fill="#38bdf8" if is_pk else ("#a78bfa" if is_fk else "#cbd5e1"), font=font_badge)

            cur_y += ROW_HEIGHT

    # Draw Relation Connectors (Orthogonal lines with arrow/endpoint badges)
    relationships = [
        # (src_tbl, src_col, dst_tbl, dst_col, label)
        ("users", "id", "classes", "coach_id", "1 : N (Coach)"),
        ("users", "id", "students", "user_id", "1 : 1 (Opt)"),
        ("classes", "id", "class_students", "class_id", "1 : N"),
        ("students", "id", "class_students", "student_id", "1 : N"),
        ("classes", "id", "attendance_sessions", "class_id", "1 : N (Holds)"),
        ("attendance_sessions", "id", "attendance_records", "session_id", "1 : N (Session)"),
        ("students", "id", "attendance_records", "student_id", "1 : N (Checks in)"),
        ("attendance_records", "id", "attendance_evidence", "record_id", "1 : 1 (Evidence)"),
    ]

    def draw_orthogonal_line(start, end, color="#38bdf8", label=""):
        sx, sy = start
        ex, ey = end
        mid_x = (sx + ex) // 2
        # draw stepped lines
        draw.line([(sx, sy), (mid_x, sy)], fill=color, width=2)
        draw.line([(mid_x, sy), (mid_x, ey)], fill=color, width=2)
        draw.line([(mid_x, ey), (ex, ey)], fill=color, width=2)
        # End dots
        draw.ellipse([(sx - 4, sy - 4), (sx + 4, sy + 4)], fill=color)
        draw.ellipse([(ex - 4, ey - 4), (ex + 4, ey + 4)], fill=color)
        # Label
        if label:
            lx, ly = mid_x - 30, (sy + ey) // 2 - 10
            draw.rectangle([(lx - 4, ly - 2), (lx + 80, ly + 16)], fill="#0b1329", outline=color)
            draw.text((lx, ly), label, fill=color, font=font_rel)

    # 1. users -> classes (coach_id)
    u = table_bounds["users"]
    c = table_bounds["classes"]
    draw_orthogonal_line((u["x2"], u["col_y"]["id"]), (c["x1"], c["col_y"]["coach_id"]), "#60a5fa", "1 : N")

    # 2. users -> students (user_id)
    s = table_bounds["students"]
    draw_orthogonal_line((u["x1"] + 100, u["y2"]), (s["x1"] + 100, s["y1"]), "#60a5fa", "1 : 1")

    # 3. classes -> class_students (class_id)
    cs = table_bounds["class_students"]
    draw_orthogonal_line((c["x1"] + 140, c["y2"]), (cs["x1"] + 140, cs["y1"]), "#818cf8", "1 : N")

    # 4. students -> class_students (student_id)
    draw_orthogonal_line((s["x2"], s["col_y"]["id"]), (cs["x1"], cs["col_y"]["student_id"]), "#34d399", "1 : N")

    # 5. classes -> attendance_sessions (class_id)
    att_s = table_bounds["attendance_sessions"]
    draw_orthogonal_line((c["x2"], c["col_y"]["id"]), (att_s["x1"], att_s["col_y"]["class_id"]), "#ec4899", "1 : N")

    # 6. attendance_sessions -> attendance_records (session_id)
    rec = table_bounds["attendance_records"]
    draw_orthogonal_line((att_s["x2"], att_s["col_y"]["id"]), (rec["x1"], rec["col_y"]["session_id"]), "#f59e0b", "1 : N")

    # 7. students -> attendance_records (student_id)
    # Long route through bottom
    draw.line([(s["x2"], s["col_y"]["id"] + 10), (s["x2"] + 40, s["col_y"]["id"] + 10)], fill="#10b981", width=2)
    draw.line([(s["x2"] + 40, s["col_y"]["id"] + 10), (s["x2"] + 40, 1150)], fill="#10b981", width=2)
    draw.line([(s["x2"] + 40, 1150), (rec["x1"] - 40, 1150)], fill="#10b981", width=2)
    draw.line([(rec["x1"] - 40, 1150), (rec["x1"] - 40, rec["col_y"]["student_id"])], fill="#10b981", width=2)
    draw.line([(rec["x1"] - 40, rec["col_y"]["student_id"]), (rec["x1"], rec["col_y"]["student_id"])], fill="#10b981", width=2)
    draw.ellipse([(s["x2"] - 4, s["col_y"]["id"] + 6), (s["x2"] + 4, s["col_y"]["id"] + 14)], fill="#10b981")
    draw.ellipse([(rec["x1"] - 4, rec["col_y"]["student_id"] - 4), (rec["x1"] + 4, rec["col_y"]["student_id"] + 4)], fill="#10b981")
    draw.text((1050, 1130), "students 1 : N attendance_records", fill="#10b981", font=font_rel)

    # 8. attendance_records -> attendance_evidence (record_id)
    evi = table_bounds["attendance_evidence"]
    draw_orthogonal_line((rec["x1"] + 200, rec["y2"]), (evi["x1"] + 200, evi["y1"]), "#06b6d4", "1 : 1 (Evidence)")

    # Legend Panel
    draw.rectangle([(WIDTH - 700, 1420), (WIDTH - 60, 1540)], fill="#152238", outline="#2a3d5e", width=2)
    draw.text((WIDTH - 680, 1432), "ERD Key Legend & Architecture Highlights:", fill="#ffffff", font=font_tbl_header)
    draw.text((WIDTH - 680, 1466), "🔑 Primary Key (UUIDv4)   |   🔗 Foreign Key with ON DELETE CASCADE / SET NULL", fill="#94a3b8", font=font_subtitle)
    draw.text((WIDTH - 680, 1494), "🔒 Security: Bcrypt hash for passwords | Anti-replay dynamic QR tokens with TTL 45s", fill="#94a3b8", font=font_subtitle)
    draw.text((WIDTH - 680, 1518), "🛡️ Constraint: UNIQUE(session_id, student_id) prevents multiple check-ins per session", fill="#38bdf8", font=font_subtitle)

    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "ERD.png")
    img.save(output_path, "PNG")
    print(f"[SUCCESS] ERD diagram generated successfully at: {output_path}")

if __name__ == "__main__":
    create_erd()
