// Shared constants + helpers for GridToolbar

// Local variant used inside the toolbar (empty-string row vs. numeric row elsewhere)
export function parseBarPosition(val) {
  if (!val || val === 'NONE') return { type: 'NONE', row: '' }
  if (val === 'TOP') return { type: 'TOP', row: '' }
  if (val === 'BOTTOM') return { type: 'BOTTOM', row: '' }
  const m = val.match(/^AFTER_ROW=(\d+)$/)
  if (m) return { type: 'AFTER_ROW', row: m[1] }
  return { type: 'NONE', row: '' }
}

export function serializeBarPosition(type, row) {
  if (type === 'AFTER_ROW') return `AFTER_ROW=${row || 1}`
  return type
}

export const HEADER_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TEXT', label: 'Tekst' },
  { value: 'SYMBOL', label: 'Symbool' },
  { value: 'TEXT_SOCIAL', label: 'Tekst + Social' },
  { value: 'GRAPHIC', label: 'Grafisch' },
]

export const BAR_TYPE_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TEXT', label: 'Tekst' },
  { value: 'SYMBOL', label: 'Symbool' },
]

export const BAR_POS_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TOP', label: 'Boven' },
  { value: 'BOTTOM', label: 'Onder' },
  { value: 'AFTER_ROW', label: 'Na rij...' },
]

export const PLACE_EMPTY_OPTIONS = [
  { value: 'blank', label: 'Placeholder' },
  { value: 'skip', label: 'Overslaan' },
]

// Herberekent cel- of grid-afmetingen na een canvas-wijziging.
//
// fmt.FixedCellSize === false (standaard):
//   Cols/Rows blijven vast, celgrootte krimpt als ze niet meer passen.
//   TargetCellW_mm onthoudt de originele breedte zodat cellen kunnen
//   terugspringen als het canvas weer groeit.
//
// fmt.FixedCellSize === true:
//   Celgrootte blijft vast, Cols/Rows worden verminderd (of vermeerderd)
//   als cellen buiten het canvas zouden vallen.
export function withFittedAndCentered(fmt) {
  if (!fmt.CanvasWidth_mm || !fmt.CanvasHeight_mm) return fmt

  const gx = fmt.GutterX_mm || 0
  const gy = fmt.GutterY_mm || 0
  const ml = fmt.MarginLeft_mm   || 0
  const mr = fmt.MarginRight_mm  || 0
  const mt = fmt.MarginTop_mm    || 0
  const mb = fmt.MarginBottom_mm || 0

  const availW = fmt.CanvasWidth_mm  - ml - mr
  const availH = fmt.CanvasHeight_mm - mt - mb
  if (availW <= 0 || availH <= 0) return fmt

  const result = { ...fmt }

  if (fmt.FixedCellSize) {
    // ── Modus: vaste celgrootte — cols/rows aanpassen ──────────────────
    const cw = fmt.CellW_mm || 0
    const ch = fmt.CellH_mm || 0
    if (!cw || !ch) return fmt

    const maxCols = Math.max(1, Math.floor((availW + gx) / (cw + gx)))
    const maxRows = Math.max(1, Math.floor((availH + gy) / (ch + gy)))

    if ((fmt.Cols || 1) > maxCols) result.Cols = maxCols
    if ((fmt.Rows || 1) > maxRows) result.Rows = maxRows
  } else {
    // ── Modus: vaste cols/rows — celgrootte aanpassen ──────────────────
    const cols   = fmt.Cols || 1
    const rows   = fmt.Rows || 1
    const aspect = fmt.CellAspect || 1.667

    const maxCellW = (availW - (cols - 1) * gx) / cols
    const maxCellH = (availH - (rows - 1) * gy) / rows

    let cw = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0
    let ch = cw / aspect

    if (maxCellW > 0 && cw > maxCellW) { cw = maxCellW; ch = cw / aspect }
    if (maxCellH > 0 && ch > maxCellH) { ch = maxCellH; cw = ch * aspect }

    result.TargetCellW_mm = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0
    result.CellW_mm = Math.round(cw * 100) / 100
    result.CellH_mm = Math.round(ch * 1000) / 1000
  }

  return result
}
