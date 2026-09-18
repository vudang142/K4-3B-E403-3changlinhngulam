"use client"

import { useEffect, useState } from "react"
import type { ScreenId } from "./top-nav"
import { getSessionAttendance } from "@/lib/api"
import type { AttendanceListItem } from "@/lib/api"

type Verdict = "CONFIRMED" | "VERIFY" | "SUSPICIOUS"

function StageBadge({ done, index }: { done: boolean; index: number }) {
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
      style={
        done
          ? { background: "var(--pa-emerald)", color: "#04140d" }
          : { background: "var(--pa-accent)", color: "#fff" }
      }
    >
      {done ? "✓" : index}
    </span>
  )
}

function SubItem({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px]"
      style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border-soft)" }}
    >
      <span style={{ color: "var(--pa-muted)" }}>{label}</span>
      <span
        className="font-mono-pa text-xs"
        style={{ color: done ? "var(--pa-emerald)" : "var(--pa-amber)" }}
      >
        {done ? `✓ ${value}` : "collecting…"}
      </span>
    </div>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "var(--pa-emerald)" : value >= 40 ? "var(--pa-amber)" : "var(--pa-rose)"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-mono-pa text-xs" style={{ color }}>
        {value}%
      </span>
    </div>
  )
}

function getVerdictInfo(status: string) {
  if (status === "CONFIRMED") {
    return { glyph: "✓", label: "Confirmed", color: "var(--pa-emerald)", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)" }
  } else if (status === "VERIFY") {
    return { glyph: "⚠", label: "Verify", color: "var(--pa-amber)", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" }
  } else {
    return { glyph: "✗", label: "Suspicious", color: "var(--pa-rose)", bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.3)" }
  }
}

function AttendanceRow({ item }: { item: AttendanceListItem }) {
  const verdict = getVerdictInfo(item.status)
  const hasVerdict = item.status !== "PENDING"

  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3"
      style={{
        background: "var(--pa-panel)",
        border: `2px solid ${hasVerdict ? verdict.border : "var(--pa-border)"}`,
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono-pa text-xs"
        style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
      >
        {item.student_code.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-[130px]">
        <div className="text-sm font-medium">{item.full_name}</div>
        <div className="font-mono-pa text-xs" style={{ color: "var(--pa-muted)" }}>
          {item.student_code} • {item.check_in_time || "N/A"}
        </div>
      </div>

      {hasVerdict ? (
        <>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              AI Confidence
            </span>
            <ConfidenceBar value={item.ai_confidence || 0} />
          </div>
          <div className="hidden items-center gap-1.5 font-mono-pa text-[11px] md:flex">
            <span
              className="rounded px-2 py-1"
              style={{ background: "var(--pa-field)", color: "var(--pa-muted)" }}
            >
              GPS {Math.round(item.gps_distance)}m
            </span>
          </div>
          <span
            className="whitespace-nowrap rounded-md px-2.5 py-1 font-mono-pa text-[11px] font-semibold tracking-wide"
            style={{ background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.border}` }}
          >
            {verdict.glyph} {verdict.label}
          </span>
        </>
      ) : (
        <>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
              Processing...
            </span>
          </div>
          <span
            className="whitespace-nowrap rounded-md px-2.5 py-1 font-mono-pa text-[11px] font-semibold tracking-wide"
            style={{ background: "var(--pa-field)", color: "var(--pa-muted)", border: "1px solid var(--pa-border)" }}
          >
            ⏳ Pending
          </span>
        </>
      )}
    </div>
  )
}

export function VerificationScreen({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [attendance, setAttendance] = useState<AttendanceListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, verify: 0, suspicious: 0 })

  // Lấy session ID từ localStorage (được set khi generate QR)
  useEffect(() => {
    const sessionId = localStorage.getItem("active_session_id")
    if (sessionId) {
      setLastSessionId(sessionId)
    }
    setIsLoading(false)
  }, [])

  // Poll attendance data
  useEffect(() => {
    if (!lastSessionId) return

    const fetchAttendance = async () => {
      try {
        const data = await getSessionAttendance(lastSessionId)
        setAttendance(data.attendance || [])

        // Calculate summary
        const total = data.attendance?.length || 0
        const confirmed = data.attendance?.filter(a => a.status === "CONFIRMED").length || 0
        const verify = data.attendance?.filter(a => a.status === "VERIFY").length || 0
        const suspicious = data.attendance?.filter(a => a.status === "SUSPICIOUS").length || 0
        setSummary({ total, confirmed, verify, suspicious })
      } catch (error) {
        console.error("Failed to fetch attendance:", error)
      }
    }

    fetchAttendance()
    const interval = setInterval(fetchAttendance, 3000) // Poll every 3s

    return () => clearInterval(interval)
  }, [lastSessionId])

  const evidenceItems = [
    { label: "Timestamp", value: "±8s" },
    { label: "GPS distance", value: "12m" },
    { label: "Device ID", value: "Matched" },
    { label: "Session token", value: "Signed" },
  ]

  return (
    <div>
      <div
        className="flex items-center justify-between border-b px-8 py-5"
        style={{ borderColor: "var(--pa-border-soft)" }}
      >
        <div>
          <h1 className="text-2xl font-semibold">AI Verification Pipeline</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
            Real-time attendance verification from students
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: "var(--pa-field)" }}>
            <span className="text-sm" style={{ color: "var(--pa-muted)" }}>Total:</span>
            <span className="font-mono-pa font-bold" style={{ color: "var(--pa-emerald)" }}>{summary.total}</span>
          </div>
          <button
            onClick={() => onNavigate("attendance")}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: "var(--pa-accent)" }}
          >
            Live Attendance →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[320px_1fr]">
        {/* pipeline column */}
        <div className="flex flex-col gap-4">
          {/* Stage 1 */}
          <div className="rounded-xl p-4" style={{ background: "var(--pa-panel)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <div className="mb-3 flex items-center gap-3">
              <StageBadge done index={1} />
              <span className="font-medium" style={{ color: "var(--pa-emerald)" }}>
                QR Validation
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Token hash", "Valid"],
                ["Rotation window", "Current"],
                ["Replay check", "Unique"],
                ["Session bound", "Matched"],
              ].map(([l, v]) => (
                <SubItem key={l} label={l} value={v} done />
              ))}
            </div>
          </div>

          {/* Stage 2 */}
          <div className="rounded-xl p-4" style={{ background: "var(--pa-panel)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <div className="mb-3 flex items-center gap-3">
              <StageBadge done index={2} />
              <span className="font-medium" style={{ color: "var(--pa-emerald)" }}>
                Evidence Collection
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {evidenceItems.map((it) => (
                <SubItem key={it.label} label={it.label} value={it.value} done />
              ))}
            </div>
          </div>

          {/* Stage 3 */}
          <div className="rounded-xl p-4" style={{ background: "var(--pa-panel)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <div className="mb-3 flex items-center gap-3">
              <StageBadge done index={3} />
              <span className="font-medium" style={{ color: "var(--pa-emerald)" }}>
                AI Evaluation
              </span>
            </div>
            <div className="flex flex-col gap-2 pl-1">
              {["Spatial-temporal model", "Anomaly detection", "Confidence scoring"].map((l) => (
                <div key={l} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--pa-muted)" }}>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--pa-emerald)" }}
                  />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4" style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}>
            <div className="font-mono-pa mb-3 text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
              CURRENT SUMMARY
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--pa-emerald)" }}>✓ Confirmed</span>
                <span className="font-mono-pa font-bold" style={{ color: "var(--pa-emerald)" }}>{summary.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--pa-amber)" }}>⚠ Verify</span>
                <span className="font-mono-pa font-bold" style={{ color: "var(--pa-amber)" }}>{summary.verify}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--pa-rose)" }}>✗ Suspicious</span>
                <span className="font-mono-pa font-bold" style={{ color: "var(--pa-rose)" }}>{summary.suspicious}</span>
              </div>
            </div>
          </div>
        </div>

        {/* stream column */}
        <div>
          <div className="font-mono-pa mb-3 text-[12px] tracking-[0.15em]" style={{ color: "var(--pa-muted)" }}>
            LIVE VERIFICATION STREAM — {attendance.length} CHECK-INS
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-4 text-sm" style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)", color: "var(--pa-muted)" }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--pa-accent-soft)" }} />
              Loading...
            </div>
          ) : attendance.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-4 text-sm" style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)", color: "var(--pa-muted)" }}>
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--pa-accent-soft)" }} />
              Awaiting check-ins...
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {attendance.map((item) => (
                <AttendanceRow key={item.attendance_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
