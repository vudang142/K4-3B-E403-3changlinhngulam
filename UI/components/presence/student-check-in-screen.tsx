"use client"

import { FormEvent, useEffect, useState } from "react"
import {
  BadgeCheck,
  Check,
  Clock3,
  LoaderCircle,
  LocateFixed,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import type { VerificationResult, Verdict } from "@/lib/ai-service"

type LocationReading = {
  distance: number
  source: "device" | "preset"
  label?: string
}

type LocationStatus = "idle" | "requesting" | "ready" | "error"
type TokenStatus = "validating" | "valid" | "missing" | "expired" | "invalid"

const locationPresets = [
  { label: "Trong lớp", detail: "12m", distance: 12 },
  { label: "Biên", detail: "65m", distance: 65 },
  { label: "Ngoài lớp", detail: "210m", distance: 210 },
]

const verdictContent: Record<
  Verdict,
  {
    title: string
    description: string
    color: string
    background: string
    border: string
    icon: typeof BadgeCheck
  }
> = {
  confirmed: {
    title: "ĐIỂM DANH THÀNH CÔNG",
    description: "Bạn đã được ghi nhận có mặt trong buổi học.",
    color: "var(--pa-emerald)",
    background: "rgba(52, 211, 153, 0.09)",
    border: "rgba(52, 211, 153, 0.3)",
    icon: BadgeCheck,
  },
  verify: {
    title: "CẦN XÁC MINH THÊM",
    description:
      "Hệ thống chưa đủ bằng chứng để tự động xác nhận. Lab Coach sẽ kiểm tra lượt điểm danh của bạn.",
    color: "var(--pa-amber)",
    background: "rgba(251, 191, 36, 0.09)",
    border: "rgba(251, 191, 36, 0.3)",
    icon: TriangleAlert,
  },
  suspicious: {
    title: "CẦN KIỂM TRA",
    description:
      "Hệ thống phát hiện một số thông tin chưa nhất quán. Lab Coach sẽ kiểm tra lại thông tin.",
    color: "var(--pa-rose)",
    background: "rgba(251, 113, 133, 0.09)",
    border: "rgba(251, 113, 133, 0.3)",
    icon: ShieldAlert,
  },
}

function distanceBetween(
  latitude: number,
  longitude: number,
  classroomLatitude: number,
  classroomLongitude: number,
) {
  const earthRadius = 6_371_000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(classroomLatitude - latitude)
  const longitudeDelta = toRadians(classroomLongitude - longitude)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(classroomLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function estimateDistance(position: GeolocationPosition) {
  const classroomLatitude = Number(process.env.NEXT_PUBLIC_CLASSROOM_LATITUDE)
  const classroomLongitude = Number(process.env.NEXT_PUBLIC_CLASSROOM_LONGITUDE)

  if (Number.isFinite(classroomLatitude) && Number.isFinite(classroomLongitude)) {
    return Math.max(
      1,
      distanceBetween(
        position.coords.latitude,
        position.coords.longitude,
        classroomLatitude,
        classroomLongitude,
      ),
    )
  }

  return Math.max(1, Math.round(position.coords.accuracy || 12))
}

function StudentIdentity({ fullName, studentId }: { fullName: string; studentId: string }) {
  return (
    <dl
      className="divide-y overflow-hidden rounded-xl border"
      style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)" }}
    >
      <div className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3.5">
        <dt className="text-sm" style={{ color: "var(--pa-muted)" }}>
          Họ và tên
        </dt>
        <dd className="text-right text-sm font-semibold">{fullName}</dd>
      </div>
      <div className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3.5" style={{ borderColor: "var(--pa-border)" }}>
        <dt className="text-sm" style={{ color: "var(--pa-muted)" }}>
          Mã học viên
        </dt>
        <dd className="font-mono-pa text-right text-sm font-semibold tracking-wide">{studentId}</dd>
      </div>
    </dl>
  )
}

function TokenStatusCard({
  status,
  secondsLeft,
  demoMode,
}: {
  status: TokenStatus
  secondsLeft: number
  demoMode: boolean
}) {
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  if (status === "validating") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(79,70,229,0.08)", borderColor: "rgba(129,140,248,0.3)" }} aria-live="polite">
        <LoaderCircle className="shrink-0 animate-spin" size={19} style={{ color: "var(--pa-accent-soft)" }} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Đang xác minh mã QR...</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--pa-muted)" }}>Kiểm tra chữ ký và thời hạn phiên điểm danh.</p>
        </div>
      </div>
    )
  }

  if (status === "valid") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(52,211,153,0.07)", borderColor: "rgba(52,211,153,0.28)" }} aria-live="polite">
        <ShieldCheck className="shrink-0" size={20} style={{ color: "var(--pa-emerald)" }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--pa-emerald)" }}>QR hợp lệ · Phiên điểm danh đã mở</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--pa-muted)" }}>
            {demoMode ? "Chế độ demo an toàn" : "Đã xác minh QR động"} · còn {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>
      </div>
    )
  }

  const expired = status === "expired"
  const missing = status === "missing"
  const StatusIcon = expired ? Clock3 : missing ? QrCode : ShieldAlert
  const title = expired ? "Phiên điểm danh đã hết hạn" : missing ? "Chưa có mã QR điểm danh" : "Mã QR không hợp lệ"
  const description = expired
    ? "Vui lòng quét mã QR mới nhất trên màn hình lớp học."
    : missing
      ? "Hãy quét Dynamic QR của lớp để mở đúng phiên điểm danh."
      : "Không thể xác minh chữ ký của mã QR. Vui lòng quét lại mã mới."

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3" style={{ background: expired ? "rgba(251,191,36,0.07)" : "rgba(251,113,133,0.07)", borderColor: expired ? "rgba(251,191,36,0.28)" : "rgba(251,113,133,0.28)" }} role="alert">
      <StatusIcon className="mt-0.5 shrink-0" size={20} style={{ color: expired ? "var(--pa-amber)" : "var(--pa-rose)" }} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold" style={{ color: expired ? "var(--pa-amber)" : "var(--pa-rose)" }}>{title}</p>
        <p className="mt-1 text-xs leading-5" style={{ color: "var(--pa-muted)" }}>{description}</p>
      </div>
    </div>
  )
}

export function StudentCheckInScreen({
  qrToken = null,
  demoMode = false,
}: {
  qrToken?: string | null
  demoMode?: boolean
}) {
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [location, setLocation] = useState<LocationReading | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle")
  const [locationError, setLocationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState("")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [checkInToken, setCheckInToken] = useState("")
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("validating")
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0)
  const [tokenSecondsLeft, setTokenSecondsLeft] = useState(0)

  const canSubmit =
    Boolean(fullName.trim() && studentId.trim() && location && checkInToken) &&
    tokenStatus === "valid" &&
    !isSubmitting

  useEffect(() => {
    let cancelled = false

    async function exchangeQrToken() {
      setTokenStatus("validating")

      try {
        let token = qrToken
        if (!token && demoMode) {
          const issueResponse = await fetch("/api/attendance/token", { cache: "no-store" })
          if (!issueResponse.ok) throw new Error("Could not create demo token")
          const issued = (await issueResponse.json()) as { token: string }
          token = issued.token
        }

        if (!token) {
          if (!cancelled) setTokenStatus("missing")
          return
        }

        const response = await fetch("/api/attendance/token/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = (await response.json()) as {
          valid: boolean
          reason?: string
          checkInToken?: string
          expiresAt?: number
        }

        if (cancelled) return
        if (!response.ok || !data.valid || !data.checkInToken || !data.expiresAt) {
          setTokenStatus(data.reason === "expired" ? "expired" : "invalid")
          return
        }

        setCheckInToken(data.checkInToken)
        setTokenExpiresAt(data.expiresAt)
        setTokenSecondsLeft(Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000)))
        setTokenStatus("valid")
      } catch {
        if (!cancelled) setTokenStatus("invalid")
      }
    }

    void exchangeQrToken()
    return () => {
      cancelled = true
    }
  }, [demoMode, qrToken])

  useEffect(() => {
    if (tokenStatus !== "valid" || !tokenExpiresAt) return

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((tokenExpiresAt - Date.now()) / 1000))
      setTokenSecondsLeft(remaining)
      if (remaining === 0) {
        setCheckInToken("")
        setTokenStatus("expired")
      }
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [tokenExpiresAt, tokenStatus])

  function requestLocation() {
    setLocationError("")
    setRequestError("")

    if (!("geolocation" in navigator)) {
      setLocationStatus("error")
      setLocationError("Thiết bị không hỗ trợ GPS. Vui lòng chọn một vị trí demo bên dưới.")
      return
    }

    setLocationStatus("requesting")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ distance: estimateDistance(position), source: "device" })
        setLocationStatus("ready")
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Quyền truy cập vị trí chưa được cấp. Bạn có thể thử lại hoặc dùng preset demo."
            : "Chưa thể xác định vị trí. Vui lòng thử lại hoặc dùng preset demo."
        setLocation(null)
        setLocationStatus("error")
        setLocationError(message)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  function selectPreset(preset: (typeof locationPresets)[number]) {
    setLocation({ distance: preset.distance, source: "preset", label: preset.label })
    setLocationStatus("ready")
    setLocationError("")
    setRequestError("")
  }

  async function submitCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !location) return

    setIsSubmitting(true)
    setRequestError("")

    try {
      const now = new Date()
      const time = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gps: location.distance,
          time,
          deviceMatched: true,
          token: checkInToken,
        }),
      })

      if (!response.ok) {
        throw new Error("Verification request failed")
      }

      const data = (await response.json()) as VerificationResult
      if (!(data.verdict in verdictContent)) {
        throw new Error("Invalid verification verdict")
      }

      setResult(data)
    } catch {
      setRequestError("Không thể kết nối dịch vụ xác thực. Vui lòng thử lại sau ít phút.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setFullName("")
    setStudentId("")
    setLocation(null)
    setLocationStatus("idle")
    setLocationError("")
    setRequestError("")
    setResult(null)
  }

  if (result) {
    const content = verdictContent[result.verdict]
    const ResultIcon = content.icon

    return (
      <section className="pa-grid-bg relative flex min-h-[calc(100svh-57px)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: content.color }}
        />
        <div className="relative w-full max-w-lg">
          <div className="mb-5 flex items-center justify-center gap-2 font-mono-pa text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--pa-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: content.color }} />
            AI VERIFICATION COMPLETE
          </div>

          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--pa-panel)",
              borderColor: content.border,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
                style={{ color: content.color, background: content.background, borderColor: content.border }}
              >
                <ResultIcon size={30} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: content.color }}>
                {content.title}
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6" style={{ color: "var(--pa-muted)" }}>
                {content.description}
              </p>
            </div>

            <div className="border-t px-5 py-5 sm:px-8 sm:py-6" style={{ borderColor: "var(--pa-border-soft)" }}>
              <StudentIdentity fullName={fullName.trim()} studentId={studentId.trim()} />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--pa-border-soft)" }}>
                  <div className="font-mono-pa text-[10px] tracking-[0.14em]" style={{ color: "var(--pa-muted)" }}>
                    KHOẢNG CÁCH
                  </div>
                  <div className="font-mono-pa mt-1 text-sm font-semibold">~{location?.distance}m</div>
                </div>
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--pa-border-soft)" }}>
                  <div className="font-mono-pa text-[10px] tracking-[0.14em]" style={{ color: "var(--pa-muted)" }}>
                    ĐỘ TIN CẬY AI
                  </div>
                  <div className="font-mono-pa mt-1 text-sm font-semibold" style={{ color: content.color }}>
                    {Math.round(result.confidence)}%
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all duration-150 hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                style={{ borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Điểm danh lượt khác
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pa-grid-bg relative flex min-h-[calc(100svh-57px)] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg">
        <header className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono-pa text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--pa-accent-soft)" }}>
            <Sparkles size={13} aria-hidden="true" />
            PRESENCEAI · STUDENT PORTAL
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">XÁC NHẬN ĐIỂM DANH</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--pa-muted)" }}>
            Nhập thông tin và xác nhận vị trí để hoàn tất điểm danh.
          </p>
        </header>

        <form
          onSubmit={submitCheckIn}
          className="rounded-2xl border p-5 sm:p-7"
          style={{
            background: "var(--pa-panel)",
            borderColor: "var(--pa-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <TokenStatusCard status={tokenStatus} secondsLeft={tokenSecondsLeft} demoMode={demoMode} />

          <div className="space-y-5">
            <div>
              <label htmlFor="student-name" className="mb-2 block text-sm font-semibold">
                Họ và tên <span style={{ color: "var(--pa-rose)" }}>*</span>
              </label>
              <input
                id="student-name"
                name="studentName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="[ Nhập họ và tên ]"
                autoComplete="name"
                required
                className="w-full rounded-xl border px-4 py-3.5 text-base outline-none transition-all duration-150 placeholder:text-[#56637d] hover:border-indigo-400/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              />
            </div>

            <div>
              <label htmlFor="student-id" className="mb-2 block text-sm font-semibold">
                Mã học viên <span style={{ color: "var(--pa-rose)" }}>*</span>
              </label>
              <input
                id="student-id"
                name="studentId"
                type="text"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                placeholder="[ Nhập mã học viên ]"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                className="font-mono-pa w-full rounded-xl border px-4 py-3.5 text-base uppercase tracking-wide outline-none transition-all duration-150 placeholder:normal-case placeholder:tracking-normal placeholder:text-[#56637d] hover:border-indigo-400/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">
                Vị trí <span style={{ color: "var(--pa-rose)" }}>*</span>
              </legend>
              <div
                className="rounded-xl border p-4"
                style={{
                  background: location ? "rgba(52, 211, 153, 0.06)" : "var(--pa-field)",
                  borderColor: location ? "rgba(52, 211, 153, 0.3)" : "var(--pa-border)",
                }}
              >
                {location ? (
                  <div className="flex items-start gap-3" aria-live="polite">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(52, 211, 153, 0.12)", color: "var(--pa-emerald)" }}
                    >
                      <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--pa-emerald)" }}>
                        Đã xác định vị trí: cách lớp ~{location.distance}m
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
                        {location.source === "device" ? "Dữ liệu từ GPS thiết bị" : `Chế độ demo · ${location.label}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="ml-auto shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                      style={{ color: "var(--pa-accent-soft)" }}
                    >
                      Làm mới
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 shrink-0" size={20} style={{ color: "var(--pa-accent-soft)" }} aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium">📍 Vui lòng cho phép truy cập vị trí</p>
                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--pa-muted)" }}>
                          PresenceAI chỉ dùng vị trí hiện tại cho lượt xác minh này.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={locationStatus === "requesting"}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-150 hover:bg-white/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:pointer-events-none disabled:opacity-50"
                      style={{ borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
                    >
                      {locationStatus === "requesting" ? (
                        <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <LocateFixed size={16} aria-hidden="true" />
                      )}
                      {locationStatus === "requesting" ? "Đang xác định vị trí..." : "Cho phép truy cập GPS"}
                    </button>
                  </div>
                )}

                {locationError && (
                  <p className="mt-3 text-xs leading-5" style={{ color: "var(--pa-amber)" }} role="alert">
                    {locationError}
                  </p>
                )}

                <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--pa-border-soft)" }}>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <span className="font-mono-pa text-[10px] font-semibold tracking-[0.14em]" style={{ color: "var(--pa-muted)" }}>
                      DEMO MODE
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--pa-dim)" }}>
                      Preset kiểm thử nhanh
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {locationPresets.map((preset) => {
                      const selected = location?.source === "preset" && location.distance === preset.distance
                      return (
                        <button
                          key={preset.distance}
                          type="button"
                          onClick={() => selectPreset(preset)}
                          aria-pressed={selected}
                          className="rounded-lg border px-2 py-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-400/70 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                          style={{
                            background: selected ? "rgba(79, 70, 229, 0.16)" : "rgba(5, 13, 26, 0.35)",
                            borderColor: selected ? "var(--pa-accent-soft)" : "var(--pa-border-soft)",
                          }}
                        >
                          <span className="block truncate text-[11px] font-semibold sm:text-xs">{preset.label}</span>
                          <span className="font-mono-pa mt-0.5 block text-[10px]" style={{ color: "var(--pa-muted)" }}>
                            {preset.detail}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {requestError && (
            <div
              className="mt-5 rounded-lg border px-3 py-2.5 text-sm"
              style={{ color: "var(--pa-rose)", background: "rgba(251, 113, 133, 0.07)", borderColor: "rgba(251, 113, 133, 0.25)" }}
              role="alert"
            >
              {requestError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold tracking-[0.08em] text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1526] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-40"
            style={{ background: "var(--pa-accent)" }}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                <span className="normal-case tracking-normal">AI đang xác thực bằng chứng hiện diện...</span>
              </>
            ) : (
              "ĐIỂM DANH"
            )}
          </button>
        </form>

        <p className="mt-4 text-center font-mono-pa text-[10px] tracking-[0.12em]" style={{ color: "var(--pa-dim)" }}>
          GPS · TIMESTAMP · DEVICE ID · SESSION TOKEN
        </p>
      </div>
    </section>
  )
}
