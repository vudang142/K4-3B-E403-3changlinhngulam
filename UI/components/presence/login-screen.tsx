"use client"

import { useState } from "react"

const features = [
  { glyph: "◎", text: "QR mã hóa xoay mỗi 45 giây, không thể giả mạo" },
  { glyph: "◉", text: "AI đánh giá độ tin cậy theo thời gian thực" },
  { glyph: "▦", text: "Coach review & phê duyệt ngay trên dashboard" },
]

function Field({
  label,
  type,
  defaultValue,
}: {
  label: string
  type: string
  defaultValue: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono-pa text-[11px] tracking-[0.18em]" style={{ color: "var(--pa-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2"
        style={{
          background: "var(--pa-field)",
          border: "1px solid var(--pa-border)",
          color: "var(--pa-text)",
        }}
      />
    </div>
  )
}

export function LoginScreen() {
  const [remember, setRemember] = useState(false)

  return (
    <div className="grid min-h-[calc(100vh-53px)] grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="pa-grid-bg relative flex flex-col justify-between p-10" style={{ background: "#060f1f" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--pa-accent)" }}
            aria-hidden
          >
            <span className="text-xl">◯</span>
          </div>
          <div>
            <div className="font-display text-xl leading-none">PresenceAI</div>
            <div className="font-mono-pa mt-1 text-[10px] tracking-[0.22em]" style={{ color: "var(--pa-muted)" }}>
              LAB ATTENDANCE PLATFORM
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <div
            className="mb-6 flex items-center gap-3 border-t pt-6"
            style={{ borderColor: "var(--pa-border-soft)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-mono-pa text-xs"
              style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)" }}
            >
              VU
            </div>
            <div>
              <div className="text-sm font-medium">VinUniversity</div>
              <div className="text-xs" style={{ color: "var(--pa-muted)" }}>
                Hanoi, Vietnam
              </div>
            </div>
          </div>

          <div className="font-mono-pa mb-3 text-[11px] tracking-[0.22em]" style={{ color: "var(--pa-accent-soft)" }}>
            AI THỰC CHIẾN
          </div>
          <h3 className="font-display text-3xl leading-tight text-balance">
            Xác minh điểm danh bằng AI — không cần điểm danh thủ công
          </h3>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--pa-muted)" }}>
            PresenceAI được triển khai thực tế tại VinUni, tự động phân tích QR động, GPS và timestamp để đưa ra kết
            quả ngay lập tức.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {features.map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
                style={{ background: "rgba(79,70,229,0.08)", border: "1px solid var(--pa-border-soft)" }}
              >
                <span style={{ color: "var(--pa-accent-soft)" }}>{f.glyph}</span>
                <span style={{ color: "var(--pa-text)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-4xl">Welcome back</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--pa-muted)" }}>
            Sign in to your coach account
          </p>

          <div className="mt-8 flex flex-col gap-5">
            <Field label="EMAIL" type="email" defaultValue="coach@university.edu" />
            <Field label="PASSWORD" type="password" defaultValue="supersecret" />

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--pa-muted)" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--pa-accent)" }}
                />
                Remember me
              </label>
              <button className="text-sm font-medium" style={{ color: "var(--pa-accent-soft)" }}>
                Forgot password?
              </button>
            </div>

            <button
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--pa-accent)" }}
            >
              Log in
            </button>

            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--pa-dim)" }}>
              <span className="h-px flex-1" style={{ background: "var(--pa-border-soft)" }} />
              or continue with
              <span className="h-px flex-1" style={{ background: "var(--pa-border-soft)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Google", "Microsoft"].map((p) => (
                <button
                  key={p}
                  className="rounded-lg py-2.5 text-sm font-medium transition-colors"
                  style={{ background: "var(--pa-field)", border: "1px solid var(--pa-border)", color: "var(--pa-text)" }}
                >
                  {p}
                </button>
              ))}
            </div>

            <p className="text-center text-sm" style={{ color: "var(--pa-muted)" }}>
              Need access?{" "}
              <button className="font-medium" style={{ color: "var(--pa-accent-soft)" }}>
                Contact your institution admin
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
