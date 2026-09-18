"""
PresenceAI Backend - FastAPI Application
Uses in-memory state (no database required)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import sessions, attendance

# Initialize FastAPI app
app = FastAPI(
    title="PresenceAI API",
    description="AI-powered Attendance Verification System (In-Memory)",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sessions.router)
app.include_router(attendance.router)


@app.get("/")
async def root():
    return {
        "name": "PresenceAI API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
