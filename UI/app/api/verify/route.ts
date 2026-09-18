// app/api/verify/route.ts
// API endpoint cho AI presence verification

import { NextRequest, NextResponse } from "next/server"
import { verifyPresence, VerificationInput } from "@/lib/ai-service"

export async function POST(req: NextRequest) {
  try {
    const body: VerificationInput = await req.json()

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

    const result = await verifyPresence(body)
    return NextResponse.json(result)
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
