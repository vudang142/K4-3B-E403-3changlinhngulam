// lib/api.ts
// API service kết nối với backend thật

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type SessionResponse = {
  session_id: string
  qr_token: string
  qr_url: string
  room: string
  expires_at: string
  started_at: string
  is_active: boolean
}

export type QRValidationResponse = {
  valid: boolean
  session_id?: string
  class_name?: string
  room?: string
  expires_at?: string
  error?: string
}

export type CheckInResponse = {
  success: boolean
  attendance_id?: string
  status?: string
  confidence?: number
  message: string
}

export type AttendanceListItem = {
  attendance_id: string
  student_code: string
  full_name: string
  checked_in_at: string
  check_in_time?: string
  gps_distance: number
  ai_confidence?: number
  status: string
}

export type SessionDetail = {
  session_id: string
  class_id?: string
  room: string
  is_active: boolean
  summary: {
    total: number
    confirmed: number
    verify: number
    suspicious: number
  }
}

// Tạo session mới (Lab Coach)
export async function createSession(classId: string, room: string, durationMinutes: number): Promise<SessionResponse> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      class_id: classId,
      room: room,
      duration_minutes: durationMinutes
    })
  })

  if (!res.ok) throw new Error("Failed to create session")
  return res.json()
}

// Validate QR (Student scan)
export async function validateQR(qrToken: string): Promise<QRValidationResponse> {
  const res = await fetch(`${API_BASE}/api/attendance/${qrToken}`)

  if (!res.ok) throw new Error("Failed to validate QR")
  return res.json()
}

// Student check-in
export async function checkIn(data: {
  session_id: string
  student_code: string
  full_name: string
  latitude: number
  longitude: number
  gps_accuracy: number
}): Promise<CheckInResponse> {
  const res = await fetch(`${API_BASE}/api/attendance/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  if (!res.ok) throw new Error("Failed to check in")
  return res.json()
}

// Lấy session details
export async function getSession(sessionId: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`)

  if (!res.ok) throw new Error("Failed to get session")
  return res.json()
}

// Lấy danh sách attendance
export async function getSessionAttendance(sessionId: string): Promise<{
  session_id: string
  attendance: AttendanceListItem[]
}> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/attendance`)

  if (!res.ok) throw new Error("Failed to get attendance")
  return res.json()
}

// Kết thúc session
export async function endSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/end`, {
    method: "POST"
  })

  if (!res.ok) throw new Error("Failed to end session")
  return res.json()
}

// Export session as JSON
export async function exportSession(sessionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/export`)

  if (!res.ok) throw new Error("Failed to export session")
  return res.json()
}
