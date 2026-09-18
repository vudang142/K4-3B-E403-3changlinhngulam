"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { validateQR, checkIn, decodeQRToken } from "@/lib/api"

export default function AttendancePage() {
  const params = useParams()
  const token = (params?.token as string) || ""

  const [step, setStep] = useState<"loading" | "info" | "form" | "success" | "error">("loading")
  const [qrInfo, setQrInfo] = useState<{ class_name?: string; room?: string; error?: string }>({})
  const [studentCode, setStudentCode] = useState("")
  const [fullName, setFullName] = useState("")
  const [result, setResult] = useState<{ status?: string; confidence?: number; message?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function validate() {
      try {
        const decodedToken = decodeQRToken(token)
        const res = await validateQR(decodedToken)

        if (res.valid) {
          setQrInfo({
            class_name: res.class_name,
            room: res.room
          })
          setStep("form")
        } else {
          setQrInfo({ error: res.error || "Invalid QR code" })
          setStep("error")
        }
      } catch (e) {
        setQrInfo({ error: "Cannot connect to server" })
        setStep("error")
      }
    }

    if (token) validate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get GPS
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const res = await checkIn({
        qr_token: decodeQRToken(token),
        student_code: studentCode,
        full_name: fullName,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        gps_accuracy: position.coords.accuracy
      })

      setResult(res)
      setStep("success")
    } catch (e) {
      setQrInfo({ error: "Check-in failed" })
      setStep("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Validating QR code...</p>
        </div>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-400">{qrInfo.error}</p>
        </div>
      </div>
    )
  }

  if (step === "success") {
    const statusColors: Record<string, string> = {
      CONFIRMED: "bg-green-500",
      VERIFY: "bg-yellow-500",
      SUSPICIOUS: "bg-red-500"
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">
            {result.status === "CONFIRMED" ? "✅" : result.status === "VERIFY" ? "⚠️" : "❌"}
          </div>
          <h1 className="text-2xl font-bold mb-2">Check-in {result.status === "CONFIRMED" ? "Success" : "Pending"}</h1>

          <div className={`inline-block px-6 py-3 rounded-lg mb-4 ${statusColors[result.status || ""] || "bg-gray-600"}`}>
            <div className="text-3xl font-bold">{result.status}</div>
            {result.confidence && <div className="text-sm opacity-80">Confidence: {result.confidence}%</div>}
          </div>

          <p className="text-gray-400">{result.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Student Check-in</h1>
          {qrInfo.class_name && (
            <div className="text-gray-400">
              <p>{qrInfo.class_name}</p>
              <p>Room: {qrInfo.room}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Student Code</label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="HV001"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyen Van A"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="text-sm text-gray-500">
            * GPS location will be captured automatically
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 font-semibold text-lg"
          >
            {isSubmitting ? "Checking in..." : "Check In"}
          </button>
        </form>
      </div>
    </div>
  )
}
