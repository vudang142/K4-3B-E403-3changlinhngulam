"use client"

export type ScreenId = "login" | "qr" | "verify" | "attendance" | "checkin"

const items: { id: ScreenId; label: string }[] = [
  { id: "login", label: "1 · Login" },
  { id: "qr", label: "2 · QR Generation" },
  { id: "verify", label: "3 · AI Verification" },
  { id: "attendance", label: "4 · Live Attendance" },
  { id: "checkin", label: "5 · Student Check-in" },
]

export function TopNav({
  active,
  onChange,
}: {
  active: ScreenId
  onChange: (id: ScreenId) => void
}) {
  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto border-b px-4 py-3 sm:px-5"
      style={{ borderColor: "var(--pa-border-soft)", background: "rgba(5,13,26,0.85)" }}
    >
      <span className="font-mono-pa mr-2 shrink-0 text-[13px] font-medium tracking-[0.25em] sm:mr-4">PRESENCEAI</span>
      <div className="flex min-w-max items-center gap-1">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              style={{
                background: isActive ? "var(--pa-accent)" : "transparent",
                color: isActive ? "#fff" : "var(--pa-muted)",
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
