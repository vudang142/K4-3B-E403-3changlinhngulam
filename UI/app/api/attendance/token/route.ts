import { networkInterfaces } from "node:os"
import { NextRequest, NextResponse } from "next/server"
import { createAttendanceToken } from "@/lib/attendance-token"

export const runtime = "nodejs"

const QR_TOKEN_TTL = 45_000
const SESSION_ID = "CS-401-DISTRIBUTED-SYSTEMS-LAB"

function findPrivateNetworkAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address
      }
    }
  }

  return null
}

function resolvePublicOrigin(request: NextRequest) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "")

  const origin = request.nextUrl.origin
  const url = new URL(origin)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") {
    const networkAddress = findPrivateNetworkAddress()
    if (networkAddress) url.hostname = networkAddress
  }

  return url.origin
}

export async function GET(request: NextRequest) {
  try {
    const issuedToken = createAttendanceToken("qr", SESSION_ID, QR_TOKEN_TTL)
    const checkInUrl = new URL("/check-in", resolvePublicOrigin(request))
    checkInUrl.searchParams.set("token", issuedToken.token)

    return NextResponse.json(
      {
        ...issuedToken,
        checkInUrl: checkInUrl.toString(),
        token: issuedToken.token,
        sessionId: SESSION_ID,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("Attendance token creation failed:", error)
    return NextResponse.json({ error: "Attendance token service unavailable" }, { status: 500 })
  }
}
