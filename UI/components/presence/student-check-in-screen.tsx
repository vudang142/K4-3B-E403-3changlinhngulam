"use client"

import { FormEvent, useEffect, useState, useRef } from "react"
import {
  BadgeCheck,
  Check,
  Clock3,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  WifiOff,
} from "lucide-react"
import { validateQR, checkIn } from "@/lib/api"

type Verdict = "confirmed" | "verify" | "suspicious"

type VerificationResult = {
  verdict: Verdict
  confidence: number
  reason: string
}

type LocationReading = {
  latitude: number
  longitude: number
  accuracy: number
}

type LocationStatus = "idle" | "requesting" | "ready" | "error"
type TokenStatus = "validating" | "valid" | "missing" | "expired" | "invalid" | "error"
type NetworkStatus = "online" | "offline"

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

function StudentIdentity({ fullName, studentId }: { fullName: string; studentId: string }) {
  return (
    <dl className="divide-y overflow-hidden rounded-xl border" style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)" }}>
      <div className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3.5">
        <dt className="text-sm" style={{ color: "var(--pa-muted)" }}>Họ và tên</dt>
        <dd className="text-right text-sm font-semibold">{fullName}</dd>
      </div>
      <div className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3.5" style={{ borderColor: "var(--pa-border)" }}>
        <dt className="text-sm" style={{ color: "var(--pa-muted)" }}>Mã học viên</dt>
        <dd className="font-mono-pa text-right text-sm font-semibold tracking-wide">{studentId}</dd>
      </div>
    </dl>
  )
}

function TokenStatusCard({ status, secondsLeft }: { status: TokenStatus; secondsLeft: number }) {
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  if (status === "validating") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(79,70,229,0.08)", borderColor: "rgba(129,140,248,0.3)" }}>
        <LoaderCircle className="shrink-0 animate-spin" size={19} style={{ color: "var(--pa-accent-soft)" }} />
        <div>
          <p className="text-sm font-semibold">Đang xác minh mã QR...</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--pa-muted)" }}>Kiểm tra chữ ký và thời hạn phiên điểm danh.</p>
        </div>
      </div>
    )
  }

  if (status === "valid") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(52,211,153,0.07)", borderColor: "rgba(52,211,153,0.28)" }}>
        <ShieldCheck className="shrink-0" size={20} style={{ color: "var(--pa-emerald)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--pa-emerald)" }}>QR hợp lệ · Phiên điểm danh đã mở</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--pa-muted)" }}>còn {minutes}:{seconds.toString().padStart(2, "0")}</p>
        </div>
      </div>
    )
  }

  const expired = status === "expired"
  const missing = status === "missing"
  const error = status === "error"
  const invalid = status === "invalid"
  const StatusIcon = expired ? Clock3 : missing ? MapPin : error ? WifiOff : ShieldAlert
  const title = expired ? "Phiên điểm danh đã hết hạn" : missing ? "Chưa có mã QR điểm danh" : error ? "Không thể kết nối máy chủ" : "Mã QR không hợp lệ"
  const description = expired ? "Vui lòng quét mã QR mới nhất trên màn hình lớp học." : missing ? "Hãy quét Dynamic QR của lớp để mở đúng phiên điểm danh." : error ? "Kiểm tra kết nối internet và thử lại." : "Không thể xác minh chữ ký của mã QR. Vui lòng quét lại mã mới."
  const bgColor = expired ? "rgba(251,191,36,0.07)" : error ? "rgba(251,113,133,0.07)" : "rgba(251,113,133,0.07)"
  const borderColor = expired ? "rgba(251,191,36,0.28)" : "rgba(251,113,133,0.28)"
  const textColor = expired ? "var(--pa-amber)" : "var(--pa-rose)"

  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3" style={{ background: bgColor, borderColor }} role="alert">
      <StatusIcon className="mt-0.5 shrink-0" size={20} style={{ color: textColor }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: textColor }}>{title}</p>
        <p className="mt-1 text-xs leading-5" style={{ color: "var(--pa-muted)" }}>{description}</p>
      </div>
    </div>
  )
}

export function StudentCheckInScreen({ sessionId, qrToken }: { sessionId?: string | null; qrToken?: string | null }) {
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [gpsLocation, setGpsLocation] = useState<LocationReading | null>(null)
  const [gpsStatus, setGpsStatus] = useState<LocationStatus>("idle")
  const [gpsError, setGpsError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestError, setRequestError] = useState("")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("validating")
  const [tokenSecondsLeft, setTokenSecondsLeft] = useState(0)
  const [sessionExpiredAt, setSessionExpiredAt] = useState<number>(0)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("online")
  const watchIdRef = useRef<number | null>(null)

  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online")
    const handleOffline = () => setNetworkStatus("offline")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setNetworkStatus(navigator.onLine ? "online" : "offline")

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const canSubmit = Boolean(
    fullName.trim() && studentId.trim() && gpsLocation && sessionId && qrToken &&
    tokenStatus === "valid" && networkStatus === "online" && !isSubmitting
  )

  // Validate QR token on mount
  useEffect(() => {
    let cancelled = false

    async function validateToken() {
      if (!qrToken) {
        if (!cancelled) setTokenStatus("missing")
        return
      }

      if (!navigator.onLine) {
        if (!cancelled) setTokenStatus("error")
        return
      }

      if (!cancelled) setTokenStatus("validating")

      try {
        const res = await validateQR(qrToken)

        if (cancelled) return

        if (res.valid && res.expires_at) {
          setSessionExpiredAt(new Date(res.expires_at).getTime())
          setTokenSecondsLeft(Math.max(0, Math.floor((new Date(res.expires_at).getTime() - Date.now()) / 1000)))
          setTokenStatus("valid")
        } else {
          setTokenStatus("invalid")
        }
      } catch {
        if (!cancelled) setTokenStatus("error")
      }
    }

    validateToken()

    return () => { cancelled = true }
  }, [qrToken])

  // Countdown timer
  useEffect(() => {
    if (tokenStatus !== "valid" || !sessionExpiredAt) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((sessionExpiredAt - Date.now()) / 1000))
      setTokenSecondsLeft(remaining)
      if (remaining === 0) setTokenStatus("expired")
    }, 1000)

    return () => clearInterval(interval)
  }, [tokenStatus, sessionExpiredAt])

  function requestGPS() {
    console.log("GPS: Requesting location...")
    setGpsError("")
    setGpsStatus("requesting")

    if (!navigator.geolocation) {
      setGpsStatus("error")
      setGpsError("Thiết bị không hỗ trợ GPS.")
      return
    }

    const handleSuccess = (position: GeolocationPosition) => {
      console.log("GPS: Success", position.coords.latitude, position.coords.longitude)
      setGpsLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
      setGpsStatus("ready")
      setGpsError("")
    }

    const handleError = (error: GeolocationPositionError) => {
  console.error("GPS ERROR:", {
    code: error.code,
    message: error.message,
    PERMISSION_DENIED: error.PERMISSION_DENIED,
    POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
    TIMEOUT: error.TIMEOUT,
  })

  setGpsLocation(null)
  setGpsStatus("error")

  if (error.code === 1) {
    setGpsError(
      `GPS error code 1 (PERMISSION_DENIED): ${error.message}`
    )
  } else if (error.code === 2) {
    setGpsError(
      `GPS error code 2 (POSITION_UNAVAILABLE): ${error.message}`
    )
  } else if (error.code === 3) {
    setGpsError(
      `GPS error code 3 (TIMEOUT): ${error.message}`
    )
  } else {
    setGpsError(
      `GPS error code ${error.code}: ${error.message}`
    )
  }
}

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    })
  }

  async function submitCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || !gpsLocation || !sessionId || !qrToken) return

    setIsSubmitting(true)
    setRequestError("")

    try {
      const res = await checkIn({
        session_id: sessionId,
        student_code: studentId,
        full_name: fullName,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        gps_accuracy: gpsLocation.accuracy
      })

      if (res.success) {
        const verdict = res.status === "CONFIRMED" ? "confirmed" : res.status === "VERIFY" ? "verify" : "suspicious"
        setResult({ verdict, confidence: res.confidence || 50, reason: res.message || "" })
      } else {
        setRequestError(res.message || "Điểm danh thất bại. Vui lòng thử lại.")
      }
    } catch {
      setRequestError("Không thể kết nối máy chủ. Vui lòng kiểm tra internet.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setFullName("")
    setStudentId("")
    setGpsLocation(null)
    setGpsStatus("idle")
    setGpsError("")
    setRequestError("")
    setResult(null)
  }

  // Show result screen
  if (result) {
    const content = verdictContent[result.verdict]
    const ResultIcon = content.icon

    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12" style={{ background: "var(--pa-bg)" }}>
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-3xl" style={{ background: content.color }} />
        <div className="relative w-full max-w-lg">
          <div className="mb-5 flex items-center justify-center gap-2 font-mono-pa text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--pa-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: content.color }} />
            AI VERIFICATION COMPLETE
          </div>

          <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--pa-panel)", borderColor: content.border, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div className="px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border" style={{ color: content.color, background: content.background, borderColor: content.border }}>
                <ResultIcon size={30} strokeWidth={1.8} />
              </div>
              <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: content.color }}>{content.title}</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6" style={{ color: "var(--pa-muted)" }}>{content.description}</p>
            </div>

            <div className="border-t px-5 py-5 sm:px-8 sm:py-6" style={{ borderColor: "var(--pa-border-soft)" }}>
              <StudentIdentity fullName={fullName.trim()} studentId={studentId.trim()} />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--pa-border-soft)" }}>
                  <div className="font-mono-pa text-[10px] tracking-[0.14em]" style={{ color: "var(--pa-muted)" }}>GPS</div>
                  <div className="font-mono-pa mt-1 text-sm font-semibold">{gpsLocation ? `${gpsLocation.latitude.toFixed(5)}, ${gpsLocation.longitude.toFixed(5)}` : "-"}</div>
                </div>
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--pa-border-soft)" }}>
                  <div className="font-mono-pa text-[10px] tracking-[0.14em]" style={{ color: "var(--pa-muted)" }}>ĐỘ TIN CẬY</div>
                  <div className="font-mono-pa mt-1 text-sm font-semibold" style={{ color: content.color }}>{Math.round(result.confidence)}%</div>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all hover:bg-white/[0.04] active:scale-[0.98]"
                style={{ borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              >
                <RotateCcw size={16} />
                Điểm danh lượt khác
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Main check-in form
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12" style={{ background: "var(--pa-bg)" }}>
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <header className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 font-mono-pa text-[10px] font-semibold tracking-[0.2em]" style={{ color: "var(--pa-accent-soft)" }}>
            <Sparkles size={13} />
            PRESENCEAI · STUDENT PORTAL
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">XÁC NHẬN ĐIỂM DANH</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--pa-muted)" }}>Nhập thông tin và xác nhận vị trí để hoàn tất điểm danh.</p>
        </header>

        <form onSubmit={submitCheckIn} className="rounded-2xl border p-5 sm:p-7" style={{ background: "var(--pa-panel)", borderColor: "var(--pa-border)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <TokenStatusCard status={tokenStatus} secondsLeft={tokenSecondsLeft} />

          <div className="space-y-5">
            {/* Họ và tên */}
            <div>
              <label htmlFor="student-name" className="mb-2 block text-sm font-semibold">
                Họ và tên <span style={{ color: "var(--pa-rose)" }}>*</span>
              </label>
              <input
                id="student-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="[ Nhập họ và tên ]"
                autoComplete="name"
                required
                disabled={tokenStatus !== "valid"}
                className="w-full rounded-xl border px-4 py-3.5 text-base outline-none transition-all placeholder:text-[#56637d] focus:border-indigo-400 disabled:opacity-50"
                style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              />
            </div>

            {/* Mã học viên */}
            <div>
              <label htmlFor="student-id" className="mb-2 block text-sm font-semibold">
                Mã học viên <span style={{ color: "var(--pa-rose)" }}>*</span>
              </label>
              <input
                id="student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="[ Nhập mã học viên ]"
                autoCapitalize="characters"
                spellCheck={false}
                required
                disabled={tokenStatus !== "valid"}
                className="font-mono-pa w-full rounded-xl border px-4 py-3.5 text-base uppercase tracking-wide outline-none transition-all placeholder:normal-case placeholder:tracking-normal placeholder:text-[#56637d] focus:border-indigo-400 disabled:opacity-50"
                style={{ background: "var(--pa-field)", borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
              />
            </div>

            {/* GPS Location */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Vị trí GPS <span style={{ color: "var(--pa-rose)" }}>*</span>
              </label>
              <div className="rounded-xl border p-4" style={{ background: gpsLocation ? "rgba(52, 211, 153, 0.06)" : "var(--pa-field)", borderColor: gpsLocation ? "rgba(52, 211, 153, 0.3)" : "var(--pa-border)" }}>
                {gpsLocation ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(52, 211, 153, 0.12)", color: "var(--pa-emerald)" }}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--pa-emerald)" }}>Đã xác định vị trí thành công</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--pa-muted)" }}>
                        {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)} (±{Math.round(gpsLocation.accuracy)}m)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={requestGPS}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-white/[0.05]"
                      style={{ color: "var(--pa-accent-soft)" }}
                    >
                      <RefreshCw size={12} />
                      Cập nhật
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 shrink-0" size={20} style={{ color: "var(--pa-accent-soft)" }} />
                      <div>
                        <p className="text-sm font-medium">📍 Vui lòng cho phép truy cập vị trí</p>
                        <p className="mt-1 text-xs leading-5" style={{ color: "var(--pa-muted)" }}>PresenceAI cần GPS để xác minh bạn có mặt trong lớp.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={requestGPS}
                      disabled={gpsStatus === "requesting" || tokenStatus !== "valid"}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ borderColor: "var(--pa-border)", color: "var(--pa-text)" }}
                    >
                      {gpsStatus === "requesting" ? (
                        <>
                          <LoaderCircle className="animate-spin" size={16} />
                          Đang lấy vị trí...
                        </>
                      ) : (
                        <>
                          <LocateFixed size={16} />
                          Cho phép truy cập GPS
                        </>
                      )}
                    </button>
                  </div>
                )}

                {gpsError && (
                  <p className="mt-3 text-xs leading-5" style={{ color: "var(--pa-rose)" }} role="alert">
                    {gpsError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {requestError && (
            <div className="mt-5 rounded-lg border px-3 py-2.5 text-sm" style={{ color: "var(--pa-rose)", background: "rgba(251, 113, 133, 0.07)", borderColor: "rgba(251, 113, 133, 0.25)" }} role="alert">
              {requestError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold tracking-[0.08em] text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
            style={{ background: "var(--pa-accent)" }}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" size={17} />
                <span className="normal-case tracking-normal">AI đang xác thực...</span>
              </>
            ) : (
              "ĐIỂM DANH"
            )}
          </button>
        </form>

        <p className="mt-4 text-center font-mono-pa text-[10px] tracking-[0.12em]" style={{ color: "var(--pa-dim)" }}>
          GPS · TIMESTAMP · SESSION TOKEN
        </p>
      </div>
    </section>
  )
}
