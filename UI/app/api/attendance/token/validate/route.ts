import { NextRequest, NextResponse } from "next/server"
import { createAttendanceToken, verifyAttendanceToken } from "@/lib/attendance-token"

export const runtime = "nodejs"

const CHECK_IN_TOKEN_TTL = 5 * 60_000

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: unknown }
    if (typeof body.token !== "string" || !body.token) {
      return NextResponse.json({ valid: false, reason: "missing" }, { status: 400 })
    }

    const validation = verifyAttendanceToken(body.token, "qr")
    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, reason: validation.reason },
        { status: validation.reason === "expired" ? 410 : 401 },
      )
    }

    const checkInToken = createAttendanceToken(
      "check-in",
      validation.claims.sessionId,
      CHECK_IN_TOKEN_TTL,
    )

    return NextResponse.json({
      valid: true,
      checkInToken: checkInToken.token,
      expiresAt: checkInToken.expiresAt,
      sessionId: validation.claims.sessionId,
    })
  } catch (error) {
    console.error("Attendance token validation failed:", error)
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 })
  }
}
