"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react"
import type { ScreenId } from "./top-nav"
import { QrCode } from "./qr-code"

type QrTokenData = {
  token: string
  expiresAt: number
  checkInUrl: string
  sessionId: string
}

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
  const [qrData, setQrData] = useState<QrTokenData | null>(null)
  const [isLoadingQr, setIsLoadingQr] = useState(false)
  const [qrError, setQrError] = useState("")

  const fetchQrToken = useCallback(async () => {
    setIsLoadingQr(true)
    setQrError("")

    try {
      const response = await fetch("/api/attendance/token", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not create QR token")

      const data = (await response.json()) as QrTokenData
      setQrData(data)
      setCountdown(Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000)))
    } catch {
      setQrError("Không thể tạo mã QR. Vui lòng kiểm tra cấu hình token và thử lại.")
    } finally {
      setIsLoadingQr(false)
    }
  }, [])

  useEffect(() => {
    if (!active || !qrData) return

    const updateCountdown = () => {
      setCountdown(Math.max(0, Math.ceil((qrData.expiresAt - Date.now()) / 1000)))
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [active, qrData])

  useEffect(() => {
    if (!active || !qrData) return

    const refreshDelay = Math.max(0, qrData.expiresAt - Date.now())
    const timeout = setTimeout(() => void fetchQrToken(), refreshDelay)
    return () => clearTimeout(timeout)
  }, [active, fetchQrToken, qrData])

  async function startSession() {
    setActive(true)
    await fetchQrToken()
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
            style={{ background: active ? "var(--pa-emerald)" : "var(--pa-dim)" }}
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

          {!active ? (
            <button
              onClick={startSession}
              disabled={isLoadingQr}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-indigo-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:pointer-events-none disabled:opacity-50"
              style={{ background: "var(--pa-accent)" }}
            >
              {isLoadingQr ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <span aria-hidden>▦</span>}
              {isLoadingQr ? "Generating secure QR..." : "Generate Dynamic QR"}
            </button>
          ) : (
            <>
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActive(false)
                    setCountdown(45)
                    setQrData(null)
                    setQrError("")
                  }}
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
                  <span className="text-5xl font-bold">18</span>
                  <span className="text-2xl" style={{ color: "var(--pa-muted)" }}>
                    / 35
                  </span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--pa-field)" }}>
                  <div className="h-full rounded-full" style={{ width: "51%", background: "var(--pa-accent)" }} />
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--pa-muted)" }}>
                  51% of class checked in
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
              {qrError ? (
                <div
                  className="flex w-full max-w-sm flex-col items-center rounded-xl border p-6 text-center"
                  style={{ background: "rgba(251,113,133,0.06)", borderColor: "rgba(251,113,133,0.25)" }}
                  role="alert"
                >
                  <p className="text-sm leading-6" style={{ color: "var(--pa-rose)" }}>{qrError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchQrToken()}
                    className="mt-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-150 hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    style={{ borderColor: "var(--pa-border)" }}
                  >
                    <RefreshCw size={15} aria-hidden="true" /> Thử lại
                  </button>
                </div>
              ) : qrData ? (
                <>
                  <div className="relative flex items-center justify-center">
                    <div
                      className="absolute inset-0 -m-4 rounded-full"
                      style={{ border: "2px solid var(--pa-accent)", opacity: 0.5 }}
                    />
                    <QrCode value={qrData.checkInUrl} />
                  </div>

                  <div className="mt-8 flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full font-mono-pa text-lg"
                      style={{ border: "2px solid var(--pa-accent)", color: "var(--pa-accent-soft)" }}
                    >
                      {isLoadingQr ? <LoaderCircle className="animate-spin" size={20} aria-hidden="true" /> : countdown}
                    </div>
                    <div>
                      <div className="font-mono-pa text-sm">QR rotates in {countdown}s</div>
                      <div className="text-xs" style={{ color: "var(--pa-muted)" }}>
                        Signed code auto-refreshes every 45 seconds
                      </div>
                    </div>
                  </div>

                  <a
                    href={qrData.checkInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex max-w-[280px] items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                    style={{ color: "var(--pa-accent-soft)" }}
                  >
                    <ExternalLink size={14} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">Open student check-in link</span>
                  </a>

                  <div
                    className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5 font-mono-pa text-[12px] tracking-[0.1em]"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--pa-emerald)" }} />
                    </span>
                    <span style={{ color: "var(--pa-emerald)" }}>SCANNABLE QR ACTIVE</span>
                  </div>
                </>
              ) : (
                <LoaderCircle className="animate-spin" size={28} style={{ color: "var(--pa-accent-soft)" }} aria-label="Generating QR" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
