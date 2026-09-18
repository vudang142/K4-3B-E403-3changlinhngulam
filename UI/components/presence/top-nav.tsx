"use client"

export type ScreenId = "login" | "qr" | "verify" | "attendance"

const items: { id: ScreenId; label: string }[] = [
  { id: "login", label: "1 · Login" },
  { id: "qr", label: "2 · QR Generation" },
  { id: "verify", label: "3 · AI Verification" },
  { id: "attendance", label: "4 · Live Attendance" },
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
      className="flex items-center gap-2 border-b px-5 py-3"
      style={{ borderColor: "var(--pa-border-soft)", background: "rgba(5,13,26,0.85)" }}
    >
      <span className="font-mono-pa mr-4 text-[13px] font-medium tracking-[0.25em]">PRESENCEAI</span>
      <div className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
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
