"use client"

import { useEffect, useState } from "react"
import type { ScreenId } from "./top-nav"
import { verificationStream, verdictMeta, type StreamEntry } from "@/lib/presence-data"

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

function ConfidenceBar({ value, verdict }: { value: number; verdict: StreamEntry["verdict"] }) {
  const meta = verdictMeta[verdict]
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: meta.color }} />
      </div>
      <span className="font-mono-pa text-xs" style={{ color: meta.color }}>
        {value}%
      </span>
    </div>
  )
}

function StreamRow({ entry }: { entry: StreamEntry }) {
  const meta = verdictMeta[entry.verdict]
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3"
      style={{
        background: "var(--pa-panel)",
        border: `1px solid ${entry.verdict === "confirmed" ? "var(--pa-border)" : meta.border}`,
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono-pa text-xs"
        style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
      >
        {entry.initials}
      </div>
      <div className="min-w-[130px]">
        <div className="text-sm font-medium">{entry.name}</div>
        <div className="font-mono-pa text-xs" style={{ color: "var(--pa-muted)" }}>
          {entry.time}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>
          AI Confidence
        </span>
        <ConfidenceBar value={entry.confidence} verdict={entry.verdict} />
      </div>
      <div className="hidden items-center gap-1.5 font-mono-pa text-[11px] md:flex">
        {["QR", "Time", `GPS ${entry.gps}m`].map((t) => (
          <span
            key={t}
            className="rounded px-2 py-1"
            style={{ background: "var(--pa-field)", color: "var(--pa-muted)" }}
          >
            {t}
          </span>
        ))}
      </div>
      <span
        className="whitespace-nowrap rounded-md px-2.5 py-1 font-mono-pa text-[11px] font-semibold tracking-wide"
        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
      >
        {meta.glyph} {meta.label}
      </span>
    </div>
  )
}

export function VerificationScreen({ onNavigate }: { onNavigate: (id: ScreenId) => void }) {
  const [evidenceDone, setEvidenceDone] = useState(false)
  const [processed, setProcessed] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setEvidenceDone(true), 2600)
    const timers = verificationStream.map((_, i) =>
      setTimeout(() => setProcessed(i + 1), 3200 + i * 700),
    )
    return () => {
      clearTimeout(t1)
      timers.forEach(clearTimeout)
    }
  }, [])

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
            Automatic evidence collection and AI presence evaluation
          </p>
        </div>
        <button
          onClick={() => onNavigate("attendance")}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: "var(--pa-accent)" }}
        >
          Live Attendance →
        </button>
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
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--pa-panel)",
              border: `1px solid ${evidenceDone ? "rgba(52,211,153,0.25)" : "var(--pa-border)"}`,
            }}
          >
            <div className="mb-3 flex items-center gap-3">
              <StageBadge done={evidenceDone} index={2} />
              <span className="font-medium" style={{ color: evidenceDone ? "var(--pa-emerald)" : "var(--pa-text)" }}>
                Evidence Collection
              </span>
              {!evidenceDone && (
                <span className="font-mono-pa ml-auto text-xs" style={{ color: "var(--pa-accent-soft)" }}>
                  Processing…
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {evidenceItems.map((it) => (
                <SubItem key={it.label} label={it.label} value={it.value} done={evidenceDone} />
              ))}
            </div>
          </div>

          {/* Stage 3 */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--pa-panel)",
              border: `1px solid ${evidenceDone ? "rgba(52,211,153,0.25)" : "var(--pa-border-soft)"}`,
              opacity: evidenceDone ? 1 : 0.5,
            }}
          >
            <div className="mb-3 flex items-center gap-3">
              <StageBadge done={evidenceDone} index={3} />
              <span className="font-medium" style={{ color: evidenceDone ? "var(--pa-emerald)" : "var(--pa-muted)" }}>
                AI Evaluation
              </span>
            </div>
            <div className="flex flex-col gap-2 pl-1">
              {["Spatial-temporal model", "Anomaly detection", "Confidence scoring"].map((l) => (
                <div key={l} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--pa-muted)" }}>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: evidenceDone ? "var(--pa-emerald)" : "var(--pa-dim)" }}
                  />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl p-4" style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}>
            <div className="font-mono-pa mb-3 text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
              VERDICT LEGEND
            </div>
            <div className="flex flex-col gap-2">
              {(["confirmed", "verify", "suspicious"] as const).map((v) => {
                const meta = verdictMeta[v]
                const range =
                  v === "confirmed" ? "Conf. ≥ 85%" : v === "verify" ? "Conf. 40–84%" : "Conf. < 40%"
                return (
                  <div
                    key={v}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: meta.color }}>
                      {meta.glyph} {v === "confirmed" ? "Confirmed" : v === "verify" ? "Verify" : "Suspicious"}
                    </span>
                    <span className="font-mono-pa text-xs" style={{ color: "var(--pa-muted)" }}>
                      {range}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* stream column */}
        <div>
          <div className="font-mono-pa mb-3 text-[12px] tracking-[0.15em]" style={{ color: "var(--pa-muted)" }}>
            LIVE VERIFICATION STREAM — {processed} PROCESSED
          </div>
          {processed === 0 ? (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-4 text-sm"
              style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)", color: "var(--pa-muted)" }}
            >
              <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--pa-accent-soft)" }} />
              Awaiting scans…
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {verificationStream.slice(0, processed).map((e) => (
                <StreamRow key={e.name} entry={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
