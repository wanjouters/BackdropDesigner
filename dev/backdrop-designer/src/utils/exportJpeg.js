import sponsors from '../data/sponsors.json'
import { parseBarPosition } from './barPosition'
import { logoUrl } from './logoUrl'

const sponsorMap = Object.fromEntries(sponsors.map(s => [s.partner, s]))

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function exportJpeg(format, slots, customLogos = {}) {
  const {
    Cols, Rows,
    CellW_mm, CellAspect, CellH_mm,
    GutterX_mm, GutterY_mm,
    MarginLeft_mm, MarginTop_mm, MarginRight_mm, MarginBottom_mm,
    CanvasWidth_mm, CanvasHeight_mm,
    BackgroundColor_Hex,
    HeaderType, HeaderHeight_mm, HeaderMargin_mm,
    DefaultBarType, DefaultBarPosition,
    DefaultBarHeight_mm, DefaultBarGapTop_mm, DefaultBarGapBottom_mm,
    Code,
  } = format

  const cellH = CellH_mm || (CellW_mm && CellAspect ? CellW_mm / CellAspect : 100)
  const hasHeader = HeaderType && HeaderType !== 'NONE'
  const hasBar = DefaultBarType && DefaultBarType !== 'NONE'
  const barPos = parseBarPosition(DefaultBarPosition)

  // Scale to max 3000px on longest side, max 2px/mm
  const maxPx = 3000
  const scale = Math.min(maxPx / CanvasWidth_mm, maxPx / CanvasHeight_mm, 2)

  const canvasEl = document.createElement('canvas')
  canvasEl.width = Math.round(CanvasWidth_mm * scale)
  canvasEl.height = Math.round(CanvasHeight_mm * scale)
  const ctx = canvasEl.getContext('2d')

  // Background
  ctx.fillStyle = BackgroundColor_Hex || '#000000'
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height)

  const s = scale
  const headerOffset = hasHeader ? (HeaderHeight_mm || 0) + (HeaderMargin_mm || 0) : 0

  // Header band
  if (hasHeader && HeaderHeight_mm) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(
      MarginLeft_mm * s,
      MarginTop_mm * s,
      (CanvasWidth_mm - MarginLeft_mm - MarginRight_mm) * s,
      HeaderHeight_mm * s
    )
  }

  // Bar band
  let barY = null
  if (hasBar) {
    if (barPos.type === 'TOP') barY = MarginTop_mm + headerOffset
    else if (barPos.type === 'BOTTOM') barY = CanvasHeight_mm - MarginBottom_mm - (DefaultBarHeight_mm || 0)
    else if (barPos.type === 'AFTER_ROW') {
      barY = MarginTop_mm + headerOffset
        + barPos.row * (cellH + GutterY_mm)
        + (DefaultBarGapTop_mm || 0)
    }
  }
  if (hasBar && barY !== null && DefaultBarHeight_mm) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(
      MarginLeft_mm * s,
      barY * s,
      (CanvasWidth_mm - MarginLeft_mm - MarginRight_mm) * s,
      DefaultBarHeight_mm * s
    )
  }

  // Pre-load all unique logo images
  const uniqueSponsors = [...new Set(slots.filter(v => v && v !== 'BLANK'))]
  const imgCache = {}
  await Promise.all(uniqueSponsors.map(async name => {
    const sp = sponsorMap[name]
    if (!sp) return
    const src = customLogos[name] || logoUrl(sp.filename)
    const img = await loadImage(src)
    if (img) imgCache[name] = img
  }))

  // Draw cells
  for (let i = 0; i < slots.length; i++) {
    const col = i % Cols
    const row = Math.floor(i / Cols)
    const value = slots[i]

    const x = MarginLeft_mm + col * (CellW_mm + GutterX_mm)
    let y = MarginTop_mm + headerOffset + row * (cellH + GutterY_mm)

    if (hasBar && barPos.type === 'AFTER_ROW' && row >= barPos.row) {
      y += (DefaultBarGapTop_mm || 0) + (DefaultBarHeight_mm || 0) + (DefaultBarGapBottom_mm || 0)
    }

    const px = x * s
    const py = y * s
    const pw = CellW_mm * s
    const ph = cellH * s

    if (!value || value === 'BLANK') continue

    const img = imgCache[value]
    if (!img) continue

    // Draw logo: object-fit contain within cell
    const imgRatio = img.naturalWidth / img.naturalHeight
    const cellRatio = pw / ph
    let dw, dh, dx, dy
    if (imgRatio > cellRatio) {
      dw = pw; dh = pw / imgRatio
      dx = px; dy = py + (ph - dh) / 2
    } else {
      dh = ph; dw = ph * imgRatio
      dy = py; dx = px + (pw - dw) / 2
    }
    ctx.drawImage(img, dx, dy, dw, dh)
  }

  // Export as JPEG
  const dataUrl = canvasEl.toDataURL('image/jpeg', 0.92)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${Code}_preview.jpg`
  a.click()
}
