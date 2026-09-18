"use client"

import { QRCodeSVG } from "qrcode.react"

interface QrCodeDisplayProps {
  url: string
}

export function QrCode({ url }: QrCodeDisplayProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white p-4">
      <QRCodeSVG
        value={url}
        size={252}
        level="M"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#050d1a"
      />
    </div>
  )
}
