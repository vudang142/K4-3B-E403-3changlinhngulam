import { StudentCheckInScreen } from "@/components/presence/student-check-in-screen"

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; token?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session || null
  const qrToken = params.token || null

  return (
    <main className="min-h-screen" style={{ background: "var(--pa-bg)" }}>
      <StudentCheckInScreen sessionId={sessionId} qrToken={qrToken} />
    </main>
  )
}
