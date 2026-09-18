"use client"

import { useState } from "react"
import { students, verdictMeta, evidenceFor, type StudentRecord } from "@/lib/presence-data"

function StatCard({
  label,
  value,
  sub,
  color,
  active,
  onClick,
}: {
  label: string
  value: string
  sub: string
  color: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl p-5 text-left transition-colors"
      style={{
        background: active ? "rgba(79,70,229,0.12)" : "var(--pa-panel)",
        border: `1px solid ${active ? "var(--pa-accent)" : "var(--pa-border-soft)"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="font-mono-pa text-[11px] tracking-[0.15em]" style={{ color: "var(--pa-muted)" }}>
          {label}
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color: label === "CHECKED IN" ? "var(--pa-text)" : color }}>
        {value}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
        {sub}
      </div>
    </button>
  )
}

function Row({ s, onClick }: { s: StudentRecord; onClick: () => void }) {
  const meta = verdictMeta[s.verdict]
  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr_0.6fr] items-center gap-4 border-b px-4 py-3 text-left transition-colors hover:bg-[rgba(79,70,229,0.06)]"
      style={{ borderColor: "var(--pa-border-soft)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono-pa text-xs"
          style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
        >
          {s.initials}
        </span>
        <div>
          <div className="text-sm font-medium">{s.name}</div>
          <div className="font-mono-pa text-xs" style={{ color: "var(--pa-muted)" }}>
            {s.id}
          </div>
        </div>
      </div>
      <div className="font-mono-pa text-sm">{s.time}</div>
      <div className="font-mono-pa text-sm" style={{ color: s.gps > 50 ? meta.color : "var(--pa-emerald)" }}>
        {s.gps}m
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
          <div className="h-full rounded-full" style={{ width: `${s.confidence}%`, background: meta.color }} />
        </div>
        <span className="font-mono-pa text-xs" style={{ color: meta.color }}>
          {s.confidence}%
        </span>
      </div>
      <span
        className="w-fit whitespace-nowrap rounded-md px-2.5 py-1 font-mono-pa text-[11px] font-semibold"
        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
      >
        {meta.glyph} {meta.label}
      </span>
      <span className="text-sm" style={{ color: "var(--pa-dim)" }}>
        —
      </span>
    </button>
  )
}

function DetailPanel({ s, onClose }: { s: StudentRecord; onClose: () => void }) {
  const meta = verdictMeta[s.verdict]
  const evidence = evidenceFor(s)
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto p-6"
        style={{ background: "var(--pa-panel-2)", borderLeft: "1px solid var(--pa-border)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full font-mono-pa text-sm"
              style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
            >
              {s.initials}
            </span>
            <div>
              <div className="text-lg font-semibold">{s.name}</div>
              <div className="font-mono-pa text-xs" style={{ color: "var(--pa-muted)" }}>
                {s.id} · {s.time}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--pa-muted)" }} aria-label="Close">
            ✕
          </button>
        </div>

        <span
          className="mt-4 w-fit rounded-md px-2.5 py-1 font-mono-pa text-[11px] font-semibold"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
        >
          {meta.glyph} {meta.label}
        </span>

        <div className="font-mono-pa mt-6 mb-3 text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
          EVIDENCE BREAKDOWN
        </div>
        <div className="flex flex-col gap-3">
          {evidence.map((e) => (
            <div
              key={e.label}
              className="rounded-lg p-3"
              style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--pa-muted)" }}>
                  {e.label}
                </span>
                <span
                  className="font-mono-pa text-xs"
                  style={{ color: e.ok ? "var(--pa-emerald)" : meta.color }}
                >
                  {e.ok ? "✓ " : "✕ "}
                  {e.value}
                </span>
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--pa-dim)" }}>
                {e.note}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-5 rounded-lg p-4"
          style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--pa-muted)" }}>
              AI Confidence Score
            </span>
            <span className="font-mono-pa text-lg" style={{ color: meta.color }}>
              {s.confidence}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
            <div className="h-full rounded-full" style={{ width: `${s.confidence}%`, background: meta.color }} />
          </div>
        </div>

        {s.verdict !== "confirmed" && (
          <div className="mt-6 flex gap-3">
            <button
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold"
              style={{ background: "rgba(52,211,153,0.12)", color: "var(--pa-emerald)", border: "1px solid rgba(52,211,153,0.3)" }}
            >
              Approve
            </button>
            <button
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold"
              style={{ background: "rgba(251,113,133,0.12)", color: "var(--pa-rose)", border: "1px solid rgba(251,113,133,0.3)" }}
            >
              Reject
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export function AttendanceScreen() {
  const [selected, setSelected] = useState<StudentRecord | null>(null)

  const headers = ["STUDENT", "CHECK-IN TIME", "GPS DISTANCE", "AI CONFIDENCE", "STATUS", "RESOLUTION"]

  return (
    <div>
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-b px-8 py-5"
        style={{ borderColor: "var(--pa-border-soft)" }}
      >
        <div>
          <h1 className="text-2xl font-semibold">Live Attendance — CS-401</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
            Lab Block C · Room 214 · Session started 10:00
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-mono-pa text-[12px] tracking-[0.15em]">
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--pa-emerald)" }} />
            <span style={{ color: "var(--pa-emerald)" }}>LIVE</span>
          </span>
          <button
            className="rounded-lg px-4 py-2.5 text-sm font-medium"
            style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
          >
            Export CSV
          </button>
          <button
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: "var(--pa-accent)" }}
          >
            End Session
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="CHECKED IN" value="18/35" sub="51% attendance" color="var(--pa-accent-soft)" active />
          <StatCard label="CONFIRMED" value="13" sub="AI confidence ≥ 85%" color="var(--pa-emerald)" />
          <StatCard label="NEEDS REVIEW" value="3" sub="Confidence 40–84%" color="var(--pa-amber)" />
          <StatCard label="SUSPICIOUS" value="2" sub="Confidence < 40%" color="var(--pa-rose)" />
        </div>

        <div
          className="mt-6 overflow-x-auto rounded-xl"
          style={{ background: "var(--pa-panel)", border: "1px solid var(--pa-border-soft)" }}
        >
          <div className="min-w-[840px]">
            <div
              className="grid grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr_0.6fr] gap-4 border-b px-4 py-3 font-mono-pa text-[11px] tracking-[0.12em]"
              style={{ borderColor: "var(--pa-border-soft)", color: "var(--pa-muted)" }}
            >
              {headers.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {students.map((s) => (
              <Row key={s.id + s.name} s={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </div>
      </div>

      {selected && <DetailPanel s={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
