"use client"

import { useMemo } from "react"

const SIZE = 25

function isFinder(r: number, c: number) {
  const inBox = (br: number, bc: number) =>
    r >= br && r < br + 7 && c >= bc && c < bc + 7
  const box = (br: number, bc: number) => {
    const rr = r - br
    const cc = c - bc
    const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6
    const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4
    return edge || core
  }
  if (inBox(0, 0)) return box(0, 0)
  if (inBox(0, SIZE - 7)) return box(0, SIZE - 7)
  if (inBox(SIZE - 7, 0)) return box(SIZE - 7, 0)
  return null
}

function inFinderZone(r: number, c: number) {
  const zone = (br: number, bc: number) => r >= br && r < br + 8 && c >= bc && c < bc + 8
  return zone(0, 0) || zone(0, SIZE - 8) || zone(SIZE - 8, 0)
}

export function QrCode({ seed = 1 }: { seed?: number }) {
  const cells = useMemo(() => {
    let s = seed * 9301 + 49297
    const rand = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    const grid: boolean[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const finder = isFinder(r, c)
        if (finder !== null) {
          grid.push(finder)
        } else if (inFinderZone(r, c)) {
          grid.push(false)
        } else {
          grid.push(rand() > 0.5)
        }
      }
    }
    return grid
  }, [seed])

  return (
    <div
      className="grid overflow-hidden rounded-2xl bg-white p-4"
      style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, width: 280, height: 280 }}
      role="img"
      aria-label="Dynamic attendance QR code"
    >
      {cells.map((on, i) => (
        <div key={i} style={{ background: on ? "#050d1a" : "#fff" }} />
      ))}
    </div>
  )
}
