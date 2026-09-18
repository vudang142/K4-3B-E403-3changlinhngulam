"use client"

import { useState } from "react"
import { TopNav, type ScreenId } from "@/components/presence/top-nav"
import { IconSidebar } from "@/components/presence/icon-sidebar"
import { LoginScreen } from "@/components/presence/login-screen"
import { QrScreen } from "@/components/presence/qr-screen"
import { VerificationScreen } from "@/components/presence/verification-screen"
import { AttendanceScreen } from "@/components/presence/attendance-screen"
import { StudentCheckInScreen } from "@/components/presence/student-check-in-screen"

export default function Page() {
  const [screen, setScreen] = useState<ScreenId>("login")

  return (
    <main className="min-h-screen" style={{ background: "var(--pa-bg)" }}>
      <TopNav active={screen} onChange={setScreen} />

      {screen === "login" ? (
        <LoginScreen />
      ) : screen === "checkin" ? (
        <StudentCheckInScreen demoMode />
      ) : (
        <div className="flex">
          <IconSidebar active={screen === "qr" ? 1 : screen === "verify" ? 2 : 0} />
          <div className="min-w-0 flex-1">
            {screen === "qr" && <QrScreen onNavigate={setScreen} />}
            {screen === "verify" && <VerificationScreen onNavigate={setScreen} />}
            {screen === "attendance" && <AttendanceScreen />}
          </div>
        </div>
      )}
    </main>
  )
}
