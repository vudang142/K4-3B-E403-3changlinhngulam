import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StudentCheckInScreen } from "@/components/presence/student-check-in-screen"

export default function CheckInPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--pa-bg)" }}>
      <nav
        className="flex min-h-[57px] items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: "var(--pa-border-soft)", background: "rgba(5,13,26,0.88)" }}
        aria-label="Điều hướng điểm danh"
      >
        <Link
          href="/"
          className="font-mono-pa text-[13px] font-medium tracking-[0.22em] transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
        >
          PRESENCEAI
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          style={{ color: "var(--pa-muted)" }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Quay lại trang demo</span>
          <span className="sm:hidden">Quay lại</span>
        </Link>
      </nav>
      <StudentCheckInScreen />
    </main>
  )
}
