import { createHmac, timingSafeEqual } from "node:crypto"

export type AttendanceTokenKind = "qr" | "check-in"

type AttendanceTokenClaims = {
  kind: AttendanceTokenKind
  sessionId: string
  issuedAt: number
  expiresAt: number
}

export type AttendanceTokenValidation =
  | { valid: true; claims: AttendanceTokenClaims }
  | { valid: false; reason: "expired" | "invalid" }

const developmentSecret = "presenceai-development-secret-change-before-deploying"

function getSigningSecret() {
  const configuredSecret = process.env.ATTENDANCE_TOKEN_SECRET
  if (configuredSecret) return configuredSecret

  if (process.env.NODE_ENV !== "production") {
    return developmentSecret
  }

  throw new Error("ATTENDANCE_TOKEN_SECRET is required in production")
}

function sign(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url")
}

export function createAttendanceToken(
  kind: AttendanceTokenKind,
  sessionId: string,
  ttlMilliseconds: number,
) {
  const issuedAt = Date.now()
  const claims: AttendanceTokenClaims = {
    kind,
    sessionId,
    issuedAt,
    expiresAt: issuedAt + ttlMilliseconds,
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")

  return {
    token: `${payload}.${sign(payload)}`,
    expiresAt: claims.expiresAt,
  }
}

export function verifyAttendanceToken(
  token: string,
  expectedKind: AttendanceTokenKind,
): AttendanceTokenValidation {
  const [payload, suppliedSignature, extraPart] = token.split(".")
  if (!payload || !suppliedSignature || extraPart) {
    return { valid: false, reason: "invalid" }
  }

  try {
    const expectedSignature = Buffer.from(sign(payload), "base64url")
    const actualSignature = Buffer.from(suppliedSignature, "base64url")
    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return { valid: false, reason: "invalid" }
    }

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AttendanceTokenClaims
    if (
      claims.kind !== expectedKind ||
      typeof claims.sessionId !== "string" ||
      !Number.isFinite(claims.issuedAt) ||
      !Number.isFinite(claims.expiresAt) ||
      claims.issuedAt > Date.now() + 5_000
    ) {
      return { valid: false, reason: "invalid" }
    }

    if (claims.expiresAt <= Date.now()) {
      return { valid: false, reason: "expired" }
    }

    return { valid: true, claims }
  } catch {
    return { valid: false, reason: "invalid" }
  }
}
