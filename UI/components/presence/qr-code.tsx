"use client"

import { QRCodeSVG } from "qrcode.react"

export function QrCode({ value }: { value: string }) {
  return (
    <div
      className="flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-2xl bg-white p-3"
      role="img"
      aria-label="Dynamic attendance QR code"
    >
      <QRCodeSVG
        value={value}
        size={256}
        level="M"
        marginSize={3}
        bgColor="#ffffff"
        fgColor="#050d1a"
        title="Quét để mở màn hình điểm danh PresenceAI"
      />
    </div>
  )
}
