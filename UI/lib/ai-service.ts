// lib/ai-service.ts
// AI service cho AI Attendance - Presence Verification

export type Verdict = "confirmed" | "verify" | "suspicious"

export type VerificationInput = {
  time: string        // VD: "10:03:12"
  gps: number         // VD: 12 (meters)
  deviceMatched: boolean
  tokenValid: boolean
}

export type VerificationResult = {
  verdict: Verdict
  confidence: number  // 0-100
  reason: string
}

// Groq API call
export async function verifyPresence(input: VerificationInput): Promise<VerificationResult> {
  const apiKey = process.env.GROQ_API_KEY
  console.log("🔑 Groq API Key:", apiKey ? "loaded (length=" + apiKey.length + ")" : "NOT FOUND")

  if (!apiKey) {
    console.warn("GROQ_API_KEY not set, using mock result")
    return mockVerify(input)
  }

  const prompt = `You are an attendance verification AI.

Analyze the attendance evidence below. Determine whether the evidence is consistent with the student being physically present in the classroom.

Evidence:
- GPS distance from classroom: ${input.gps}m
- Check-in timestamp: ${input.time}
- QR Token valid: ${input.tokenValid ? "Yes" : "No"}
- Device ID matched: ${input.deviceMatched ? "Yes" : "No"}

Consider ALL signals together. Think about:
- GPS distance: is ${input.gps}m reasonable? Below 50m is ideal, 50-100m needs verification, above 100m is suspicious.
- Check-in timing: consistent with normal class start patterns?
- QR validity: expired or invalid tokens suggest suspicious behavior
- Device matching: mismatched devices suggest potential proxy attendance

Return a JSON object with these fields:
{
  "verdict": "CONFIRMED" or "VERIFY" or "SUSPICIOUS",
  "confidence": 0-100,
  "reasoning": "Your analysis considering ALL signals together",
  "uncertain_evidence": "What specific evidence caused uncertainty (if any)"
}

Example reasoning patterns:
- "GPS is within acceptable range and all other signals are consistent → CONFIRMED"
- "GPS is borderline and timestamp is unusual → VERIFY for manual review"
- "GPS far from classroom AND QR invalid → SUSPICIOUS"`

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model :"openai/gpt-oss-20b",  // Open source model ~14B params
          messages: [
            { role: "system", content: "Bạn là AI xác minh điểm danh. Luôn trả lời đúng định dạng JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API error:", response.status, errorText)
      return mockVerify(input)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.warn("No content from Groq, using mock")
      return mockVerify(input)
    }

    console.log("📦 Groq response:", content)

    // Parse JSON response
    const parsed = JSON.parse(content)
    // Normalize verdict to lowercase
    const normalizedVerdict = (parsed.verdict || "verify").toLowerCase() as Verdict
    return {
      verdict: normalizedVerdict,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      reason: parsed.reasoning || parsed.reason || "Không có lý do"
    }
  } catch (error) {
    console.error("AI verification error:", error)
    return mockVerify(input)
  }
}

// Mock fallback khi không có API key
function mockVerify(input: VerificationInput): VerificationResult {
  let verdict: Verdict = "confirmed"
  let confidence = 95
  let reasons: string[] = []

  // GPS check
  if (input.gps > 100) {
    verdict = "suspicious"
    confidence = Math.max(10, 100 - input.gps)
    reasons.push(`GPS ${input.gps}m quá xa`)
  } else if (input.gps > 50) {
    verdict = "verify"
    confidence = Math.max(50, 85 - (input.gps - 50))
    reasons.push(`GPS ${input.gps}m gần boundary`)
  } else {
    reasons.push(`GPS ${input.gps}m trong phạm vi`)
  }

  // Token check
  if (!input.tokenValid) {
    verdict = "suspicious"
    confidence = Math.min(confidence, 30)
    reasons.push("Token không hợp lệ")
  }

  // Device check
  if (!input.deviceMatched) {
    if (verdict === "suspicious") {
      confidence = Math.min(confidence, 15)
    } else {
      verdict = "verify"
      confidence = Math.min(confidence, 60)
    }
    reasons.push("Device không match")
  }

  return {
    verdict,
    confidence,
    reason: reasons.join(", ") || "Tất cả evidence đạt"
  }
}

// Export cho test runner
export { verifyPresence as default }
