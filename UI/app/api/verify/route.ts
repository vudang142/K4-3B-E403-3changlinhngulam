// app/api/verify/route.ts
// API endpoint cho AI presence verification

import { NextRequest, NextResponse } from "next/server"
import { verifyPresence, VerificationInput } from "@/lib/ai-service"
import { verifyAttendanceToken } from "@/lib/attendance-token"

type VerificationRequest = Omit<VerificationInput, "tokenValid"> & {
  token?: unknown
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerificationRequest

    // Validate input
    if (typeof body.gps !== "number" || body.gps < 0) {
      return NextResponse.json(
        { error: "GPS must be a positive number" },
        { status: 400 }
      )
    }

    if (!body.time || typeof body.time !== "string") {
      return NextResponse.json(
        { error: "Time is required" },
        { status: 400 }
      )
    }

    const tokenValidation =
      typeof body.token === "string"
        ? verifyAttendanceToken(body.token, "check-in")
        : { valid: false as const, reason: "invalid" as const }
    const input: VerificationInput = {
      gps: body.gps,
      time: body.time,
      deviceMatched: body.deviceMatched === true,
      tokenValid: tokenValidation.valid,
    }

    const result = await verifyPresence(input)
    return NextResponse.json({ ...result, tokenValid: tokenValidation.valid })
  } catch (error) {
    console.error("AI verification API error:", error)
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    model: "gemini-2.0-flash",
    endpoint: "/api/verify"
  })
}
