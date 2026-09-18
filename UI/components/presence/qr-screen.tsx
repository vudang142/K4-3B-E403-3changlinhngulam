"use client"

import { useEffect, useState } from "react"
import type { ScreenId } from "./top-nav"
import { QrCode } from "./qr-code"
import { createSession, getSessionAttendance, type SessionResponse } from "@/lib/api"

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono-pa text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
        {label}
      </label>
      <div
        className="rounded-lg px-4 py-3 text-[15px]"
        style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
      >
        {value}
      </div>
    </div>
  )
}

function SecurityBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex-1 rounded-lg px-4 py-3"
      style={{ background: "rgba(79,70,229,0.06)", border: "1px solid var(--pa-border-soft)" }}
    >
      <div className="font-mono-pa text-lg" style={{ color: "var(--pa-accent-soft)" }}>
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
        {label}
      </div>
    </div>
  )
}

export function QrScreen({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [active, setActive] = useState(false)
  const [countdown, setCountdown] = useState(45)
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Poll attendance count when session is active
  useEffect(() => {
    if (!active || !session) return

    const pollAttendance = async () => {
      try {
        const data = await getSessionAttendance(session.session_id)
        setCheckinCount(data.attendance.length)
      } catch (e) {
        console.error("Failed to poll attendance:", e)
      }
    }

    pollAttendance()
    const interval = setInterval(pollAttendance, 5000)
    return () => clearInterval(interval)
  }, [active, session])

  // Countdown timer (for display, not QR rotation)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [active])

  // Update countdown display from session expiry
  useEffect(() => {
    if (!active || !session) return

    const expiresAt = new Date(session.expires_at).getTime()
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setCountdown(remaining)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [active, session])

  // Generate session from backend
  const handleGenerateQR = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const newSession = await createSession("class-001", "E403", 30)
      setSession(newSession)
      setActive(true)
      // Save session ID for verification screen
      localStorage.setItem("active_session_id", newSession.session_id)
    } catch (e) {
      setError("Failed to create session. Is backend running?")
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setActive(false)
    setSession(null)
    setCheckinCount(0)
    setCountdown(45)
    localStorage.removeItem("active_session_id")
  }

  const handleEndSession = async () => {
    if (!session) return
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      await fetch(`${apiBase}/api/sessions/${session.session_id}/end`, { method: "POST" })
    } catch (e) {
      console.error("Failed to end session:", e)
    }
    handleReset()
  }

  return (
    <div>
      {/* header */}
      <div
        className="flex items-center justify-between border-b px-8 py-5"
        style={{ borderColor: "var(--pa-border-soft)" }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Start Attendance Session</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
            Configure and launch your QR-based session
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono-pa text-[12px] tracking-[0.15em]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: active ? "var(--pa-emerald)" : "var(--pa-emerald)" }}
          />
          {active ? "ATTENDANCE ACTIVE" : "STANDBY"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto]">
        {/* left config */}
        <div className="border-r p-8" style={{ borderColor: "var(--pa-border-soft)" }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldValue label="CLASS / COURSE" value="CS-401: Distributed Systems Lab" />
            <FieldValue label="ROOM" value="Lab Block C · Room 214" />
            <FieldValue label="EXPECTED STUDENTS" value="35" />
            <FieldValue label="DURATION" value="90 minutes" />
          </div>

          <div
            className="mt-6 rounded-xl p-5"
            style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span
                className="flex h-4 w-4 items-center justify-center rounded text-[10px] text-white"
                style={{ background: "var(--pa-accent)" }}
              >
                ✓
              </span>
              <span className="font-mono-pa text-[12px] tracking-[0.15em]" style={{ color: "var(--pa-muted)" }}>
                QR SECURITY SETTINGS
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SecurityBox value="45 sec" label="Rotation interval" />
              <SecurityBox value="50 m" label="GPS radius" />
              <SecurityBox value="± 30 sec" label="Time window" />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          {!active ? (
            <button
              onClick={handleGenerateQR}
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-colors"
              style={{ background: isLoading ? "var(--pa-muted)" : "var(--pa-accent)" }}
            >
              {isLoading ? "Creating Session..." : <><span aria-hidden>▦</span> Generate Dynamic QR</>}
            </button>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
                >
                  Reset Session
                </button>
                <button
                  onClick={() => onNavigate("verify")}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                  style={{ background: "var(--pa-accent)" }}
                >
                  View AI Verification →
                </button>
              </div>

              <div
                className="mt-6 rounded-xl p-5"
                style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}
              >
                <div className="font-mono-pa text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
                  LIVE CHECK-INS
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{checkinCount}</span>
                  <span className="text-2xl" style={{ color: "var(--pa-muted)" }}>
                    / 35
                  </span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (checkinCount / 35) * 100)}%`, background: "var(--pa-accent)" }} />
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--pa-muted)" }}>
                  {Math.round((checkinCount / 35) * 100)}% of class checked in
                </div>
              </div>
            </>
          )}
        </div>

        {/* right QR panel */}
        <div className="flex w-full flex-col items-center justify-center p-8 lg:w-[420px]">
          {!active ? (
            <>
              <div
                className="flex h-72 w-72 flex-col items-center justify-center gap-3 rounded-2xl"
                style={{ border: "1px dashed var(--pa-border)" }}
              >
                <span className="text-4xl" style={{ color: "var(--pa-dim)" }} aria-hidden>
                  ▦
                </span>
                <span style={{ color: "var(--pa-muted)" }}>Generate QR to begin</span>
              </div>
              <p className="mt-4 max-w-[16rem] text-center text-sm" style={{ color: "var(--pa-dim)" }}>
                Configure session settings and click generate
              </p>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                {/* QR code thật với URL từ backend */}
                <QrCode url={session.qr_url} />
              </div>

              <div className="mt-8 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full font-mono-pa text-lg"
                  style={{ border: "2px solid var(--pa-accent)", color: "var(--pa-accent-soft)" }}
                >
                  {countdown}
                </div>
                <div>
                  <div className="font-mono-pa text-sm">QR rotates in {countdown}s</div>
                  <div className="text-xs" style={{ color: "var(--pa-muted)" }}>
                    New code auto-generated for security
                  </div>
                </div>
              </div>

              <div
                className="mt-6 flex items-center gap-3 rounded-lg px-4 py-2.5 font-mono-pa text-[12px] tracking-[0.1em]"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--pa-emerald)" }} />
                <span style={{ color: "var(--pa-emerald)" }}>ATTENDANCE ACTIVE</span>
                <span style={{ color: "var(--pa-muted)" }}>{checkinCount}/35 checked in</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
