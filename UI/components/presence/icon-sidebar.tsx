"use client"

const icons = ["▦", "◎", "◉", "▤", "⚙"]

export function IconSidebar({ active = 0 }: { active?: number }) {
  return (
    <aside
      className="flex w-16 shrink-0 flex-col items-center gap-3 border-r py-6"
      style={{ borderColor: "var(--pa-border-soft)" }}
    >
      <div
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-white"
        style={{ background: "var(--pa-accent)" }}
        aria-hidden
      >
        <span className="font-mono-pa text-base">◯</span>
      </div>
      {icons.map((glyph, i) => (
        <button
          key={glyph}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors"
          style={{
            background: i === active ? "var(--pa-accent)" : "transparent",
            color: i === active ? "#fff" : "var(--pa-dim)",
          }}
          aria-label={`Sidebar action ${i + 1}`}
        >
          {glyph}
        </button>
      ))}
    </aside>
  )
}
