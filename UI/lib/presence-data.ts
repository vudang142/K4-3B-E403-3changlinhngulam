export type Verdict = "confirmed" | "verify" | "suspicious"

export type StudentRecord = {
  initials: string
  name: string
  id: string
  time: string
  gps: number
  confidence: number
  verdict: Verdict
}

export const students: StudentRecord[] = [
  { initials: "PM", name: "Priya Mehta", id: "CS21B041", time: "10:03:12", gps: 12, confidence: 97, verdict: "confirmed" },
  { initials: "JO", name: "James Okafor", id: "CS21B017", time: "10:04:08", gps: 8, confidence: 94, verdict: "confirmed" },
  { initials: "AT", name: "Aisha Tanaka", id: "CS21B029", time: "10:08:01", gps: 5, confidence: 99, verdict: "confirmed" },
  { initials: "MB", name: "Marco Bianchi", id: "CS21B003", time: "10:09:44", gps: 22, confidence: 88, verdict: "confirmed" },
  { initials: "SA", name: "Sofia Andersson", id: "CS21B057", time: "10:11:30", gps: 18, confidence: 91, verdict: "confirmed" },
  { initials: "RP", name: "Raj Patel", id: "CS21B062", time: "10:13:05", gps: 31, confidence: 85, verdict: "confirmed" },
  { initials: "EV", name: "Elena Volkov", id: "CS21B044", time: "10:14:22", gps: 9, confidence: 96, verdict: "confirmed" },
  { initials: "DK", name: "David Kim", id: "CS21B011", time: "10:15:50", gps: 14, confidence: 92, verdict: "confirmed" },
  { initials: "FA", name: "Fatima Al-Sayed", id: "CS21B038", time: "10:16:33", gps: 7, confidence: 98, verdict: "confirmed" },
  { initials: "LM", name: "Lucas Martins", id: "CS21B025", time: "10:17:01", gps: 26, confidence: 87, verdict: "confirmed" },
  { initials: "YN", name: "Yuki Nakamura", id: "CS21B049", time: "10:18:14", gps: 33, confidence: 83, verdict: "confirmed" },
  { initials: "NO", name: "Nia Owusu", id: "CS21B033", time: "10:19:07", gps: 11, confidence: 95, verdict: "confirmed" },
  { initials: "AH", name: "Ahmed Hassan", id: "CS21B006", time: "10:20:29", gps: 19, confidence: 90, verdict: "confirmed" },
  { initials: "LF", name: "Lena Fischer", id: "CS21B022", time: "10:06:45", gps: 48, confidence: 61, verdict: "verify" },
  { initials: "TH", name: "Tobias Huber", id: "CS21B058", time: "10:21:15", gps: 52, confidence: 55, verdict: "verify" },
  { initials: "ML", name: "Mei Lin", id: "CS21B036", time: "10:22:40", gps: 41, confidence: 67, verdict: "verify" },
  { initials: "CR", name: "Carlos Ruiz", id: "CS21B015", time: "10:07:22", gps: 214, confidence: 23, verdict: "suspicious" },
  { initials: "AD", name: "Anonymous Device", id: "CS21B???", time: "10:23:58", gps: 387, confidence: 8, verdict: "suspicious" },
]

export type StreamEntry = Pick<StudentRecord, "initials" | "name" | "time" | "confidence" | "verdict"> & {
  gps: number
}

export const verificationStream: StreamEntry[] = [
  { initials: "PM", name: "Priya Mehta", time: "10:03:12", confidence: 97, gps: 12, verdict: "confirmed" },
  { initials: "JO", name: "James Okafor", time: "10:04:08", confidence: 94, gps: 8, verdict: "confirmed" },
  { initials: "LF", name: "Lena Fischer", time: "10:06:45", confidence: 61, gps: 48, verdict: "verify" },
  { initials: "CR", name: "Carlos Ruiz", time: "10:07:22", confidence: 23, gps: 214, verdict: "suspicious" },
  { initials: "AT", name: "Aisha Tanaka", time: "10:08:01", confidence: 99, gps: 5, verdict: "confirmed" },
]

export const verdictMeta: Record<
  Verdict,
  { label: string; glyph: string; color: string; bg: string; border: string }
> = {
  confirmed: { label: "CONFIRMED", glyph: "✓", color: "var(--pa-emerald)", bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.3)" },
  verify: { label: "VERIFY", glyph: "⚠", color: "var(--pa-amber)", bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.3)" },
  suspicious: { label: "SUSPICIOUS", glyph: "!", color: "var(--pa-rose)", bg: "rgba(251, 113, 133, 0.1)", border: "rgba(251, 113, 133, 0.3)" },
}

export const evidenceFor = (s: StudentRecord) => {
  if (s.verdict === "confirmed") {
    return [
      { label: "QR Validity", value: "Valid", note: "Token from current rotation window", ok: true },
      { label: "Timestamp", value: `±${(s.gps % 12) + 4}s`, note: "Scan time within session window", ok: true },
      { label: "GPS Distance", value: `${s.gps}m from room`, note: "Inside geofence boundary", ok: true },
      { label: "Device ID", value: "Matched", note: "Device fingerprint matches enrolled profile", ok: true },
    ]
  }
  if (s.verdict === "verify") {
    return [
      { label: "QR Validity", value: "Valid", note: "Token from current rotation window", ok: true },
      { label: "Timestamp", value: "Near edge", note: "Scan time close to session boundary", ok: false },
      { label: "GPS Distance", value: `${s.gps}m from room`, note: `${s.gps - 50}m outside geofence boundary`, ok: false },
      { label: "Device ID", value: "Matched", note: "Device fingerprint matches enrolled profile", ok: true },
    ]
  }
  return [
    { label: "QR Validity", value: "Invalid / expired", note: "Token was from previous rotation window", ok: false },
    { label: "Timestamp", value: "Out of window", note: "Scan time 4m 12s outside session window", ok: false },
    { label: "GPS Distance", value: `${s.gps}m from room`, note: `${s.gps - 50}m outside geofence boundary`, ok: false },
    { label: "Device ID", value: s.name === "Anonymous Device" ? "Unknown" : "Matched", note: s.name === "Anonymous Device" ? "No enrolled device profile found" : "Device fingerprint matches enrolled profile", ok: s.name !== "Anonymous Device" },
  ]
}
