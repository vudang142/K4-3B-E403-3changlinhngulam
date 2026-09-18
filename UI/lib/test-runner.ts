// lib/test-runner.ts
// Script chạy batch test cases cho AI Attendance

import { config } from "dotenv"
import { verifyPresence, VerificationResult, Verdict } from "./ai-service"
import testCases from "../eval/test-cases.json"

// Load .env.local
config({ path: ".env.local" })

// Types
type TestCase = {
  id: number
  description: string
  input: {
    time: string
    gps: number
    deviceMatched: boolean
    tokenValid: boolean
  }
  expected: Verdict
}

type TestResult = {
  id: number
  description: string
  expected: Verdict
  actual: Verdict
  confidence: number
  reason: string
  pass: boolean
}

// Chạy tất cả test cases
async function runTests(): Promise<TestResult[]> {
  console.log("🚀 Bắt đầu chạy test cases...\n")
  console.log("=" .repeat(60))

  const results: TestResult[] = []

  for (const tc of testCases as TestCase[]) {
    process.stdout.write(`Testing case ${tc.id.toString().padStart(2, "0")}/${testCases.length}... `)

    try {
      const result = await verifyPresence(tc.input)

      const pass = result.verdict === tc.expected

      results.push({
        id: tc.id,
        description: tc.description,
        expected: tc.expected,
        actual: result.verdict,
        confidence: result.confidence,
        reason: result.reason,
        pass
      })

      const status = pass ? "✅ PASS" : "❌ FAIL"
      console.log(status)
      console.log(`   Expected: ${tc.expected}`)
      console.log(`   Actual:   ${result.verdict} (${result.confidence}%)`)
      console.log(`   Reason:   ${result.reason}`)
      console.log("-".repeat(60))

    } catch (error) {
      console.error(`❌ ERROR: ${error}`)
      results.push({
        id: tc.id,
        description: tc.description,
        expected: tc.expected,
        actual: "suspicious" as Verdict,
        confidence: 0,
        reason: `Error: ${error}`,
        pass: false
      })
    }

    // Delay để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

// Tính và hiển thị summary
function printSummary(results: TestResult[]) {
  const total = results.length
  const passed = results.filter(r => r.pass).length
  const failed = total - passed

  const byVerdict = {
    confirmed: { expected: 0, actual: 0 },
    verify: { expected: 0, actual: 0 },
    suspicious: { expected: 0, actual: 0 }
  }

  results.forEach(r => {
    byVerdict[r.expected].expected++
    byVerdict[r.actual].actual++
  })

  console.log("\n" + "=".repeat(60))
  console.log("📊 SUMMARY")
  console.log("=".repeat(60))
  console.log(`Total:  ${total} cases`)
  console.log(`Passed: ${passed} (${(passed/total*100).toFixed(1)}%)`)
  console.log(`Failed: ${failed} (${(failed/total*100).toFixed(1)}%)`)
  console.log("")
  console.log("By Expected Verdict:")
  console.log(`  Confirmed:  ${byVerdict.confirmed.expected} expected, ${byVerdict.confirmed.actual} actual`)
  console.log(`  Verify:     ${byVerdict.verify.expected} expected, ${byVerdict.verify.actual} actual`)
  console.log(`  Suspicious: ${byVerdict.suspicious.expected} expected, ${byVerdict.suspicious.actual} actual`)

  // Chi tiết failed cases
  const failedCases = results.filter(r => !r.pass)
  if (failedCases.length > 0) {
    console.log("\n" + "=".repeat(60))
    console.log("❌ FAILED CASES:")
    console.log("=".repeat(60))
    failedCases.forEach(r => {
      console.log(`Case ${r.id}: ${r.description}`)
      console.log(`  Expected: ${r.expected} | Actual: ${r.actual}`)
      console.log(`  Confidence: ${r.confidence}% | Reason: ${r.reason}`)
      console.log("")
    })
  }

  console.log("\n" + "=".repeat(60))
  console.log(`🎯 Accuracy: ${(passed/total*100).toFixed(1)}%`)
  console.log("=".repeat(60))
}

// Main
async function main() {
  const results = await runTests()
  printSummary(results)

  // Export results to JSON
  const fs = await import("fs")
  fs.writeFileSync(
    "./eval/test-results.json",
    JSON.stringify(results, null, 2)
  )
  console.log("\n💾 Results saved to eval/test-results.json")
}

main().catch(console.error)
