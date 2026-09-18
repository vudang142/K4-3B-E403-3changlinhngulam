# PresenceAI Backend

AI-powered Attendance Verification System - Backend API

## Tech Stack

- **Python** + **FastAPI**
- **PostgreSQL** + **SQLAlchemy**
- **Groq API** (GPT-OSS 20B)

## Quick Start

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and GROQ_API_KEY
```

### 3. Run server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Open API docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Sessions (Lab Coach)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create attendance session |
| GET | `/api/sessions/{session_id}` | Get session details |
| GET | `/api/sessions/{session_id}/attendance` | Get attendance list |

### Attendance (Student)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/{qr_token}` | Validate QR code |
| POST | `/api/attendance/check-in` | Student check-in |
| GET | `/api/attendance/detail/{id}` | Get attendance detail |
| POST | `/api/attendance/{id}/review` | Coach review |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app
│   ├── config.py         # Settings
│   ├── database.py       # DB connection
│   ├── api/              # API routes
│   │   ├── sessions.py
│   │   └── attendance.py
│   ├── schemas/          # Pydantic models
│   │   ├── session.py
│   │   └── attendance.py
│   ├── services/         # Business logic
│   │   ├── ai_service.py
│   │   ├── gps_service.py
│   │   └── qr_service.py
│   └── models/          # SQLAlchemy models
├── requirements.txt
├── .env.example
└── README.md
```

## Database Schema

Entities:
- `users` - Lab coaches
- `students` - Student records
- `classes` - Class information + room coordinates
- `class_students` - Enrollment
- `attendance_sessions` - Session with QR token
- `attendance_records` - Check-in records + AI results
- `attendance_evidence` - GPS + validation data

## AI Verification

The AI uses GPT-OSS 20B via Groq API to analyze:
- GPS distance
- QR validity
- Check-in timing
- Overall pattern

Returns:
- `CONFIRMED` (≥85%) - Auto record present
- `VERIFY` (40-84%) - Needs coach review
- `SUSPICIOUS` (<40%) - Flagged for review
