// Shared helper: parse DefaultBarPosition string → { type, row }
// row is always an integer (for coordinate calculations)
export function parseBarPosition(val) {
  if (!val || val === 'NONE') return { type: 'NONE', row: 0 }
  if (val === 'TOP') return { type: 'TOP', row: 0 }
  if (val === 'BOTTOM') return { type: 'BOTTOM', row: 0 }
  const m = val.match(/^AFTER_ROW=(\d+)$/)
  if (m) return { type: 'AFTER_ROW', row: parseInt(m[1]) }
  return { type: 'NONE', row: 0 }
}
