import { useState } from 'react'

// ─── HEX → CMYK (benadering, zonder kleurprofiel) ────────────────────────────
function hexToCmyk(hex) {
  if (!hex || hex.length < 7) return { c: 0, m: 0, y: 0, k: 100 }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const k = 1 - Math.max(r, g, b)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round((1 - r - k) / (1 - k) * 100),
    m: Math.round((1 - g - k) / (1 - k) * 100),
    y: Math.round((1 - b - k) / (1 - k) * 100),
    k: Math.round(k * 100),
  }
}

// ─── Format preview SVG ───────────────────────────────────────────────────────
function FormatPreview({ form }) {
  const W = form.ArtboardWidth_mm
  const H = form.ArtboardHeight_mm
  if (!W || !H || W <= 0 || H <= 0) return null

  const s = form.Scale || 0.1
  const containerW = 220
  const containerH = Math.max(30, Math.round(containerW * H / W))
  const px = containerW / W

  const cellW = (form.CellW_mm || 0) * s * px
  const cellH = (form.CellH_mm || 0) * s * px
  const gutX  = (form.GutterX_mm || 0) * s * px
  const gutY  = (form.GutterY_mm || 0) * s * px
  const marL  = (form.MarginLeft_mm   || 0) * s * px
  const marR  = (form.MarginRight_mm  || 0) * s * px
  const marT  = (form.MarginTop_mm    || 0) * s * px
  const marB  = (form.MarginBottom_mm || 0) * s * px
  const bleed = (form.Bleed_mm || 0) * s * px
  const cols  = form.Cols || 0
  const rows  = form.Rows || 0
  const bg    = form.BackgroundColor_Hex || '#050703'

  const gridW = cols > 0 ? cols * cellW + (cols - 1) * gutX : 0
  const gridH = rows > 0 ? rows * cellH + (rows - 1) * gutY : 0
  const startX = marL + Math.max(0, (containerW - marL - marR - gridW) / 2)
  const startY = marT + Math.max(0, (containerH - marT - marB - gridH) / 2)

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: startX + c * (cellW + gutX),
        y: startY + r * (cellH + gutY),
        w: cellW,
        h: cellH,
      })
    }
  }

  return (
    <div className="rounded-lg overflow-hidden bg-gray-200">
      <svg
        width="100%"
        viewBox={`${-bleed} ${-bleed} ${containerW + 2 * bleed} ${containerH + 2 * bleed}`}
        style={{ display: 'block' }}
      >
        {bleed > 0 && (
          <rect x={-bleed} y={-bleed} width={containerW + 2 * bleed} height={containerH + 2 * bleed}
            fill={bg} opacity={0.35} />
        )}
        <rect x={0} y={0} width={containerW} height={containerH} fill={bg} />
        {cells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
            fill="white" opacity={0.2} rx={1} />
        ))}
        <rect x={0} y={0} width={containerW} height={containerH}
          fill="none" stroke="white" strokeOpacity={0.15} strokeWidth={1} />
      </svg>
    </div>
  )
}

// ─── Auto-fit grid + center ───────────────────────────────────────────────────
function fitAndCenter(f) {
  const cellW = f.CellW_mm || 0
  const cellH = f.CellH_mm || 0
  const gutX  = f.GutterX_mm || 0
  const gutY  = f.GutterY_mm || 0
  const cw    = f.CanvasWidth_mm || 0
  const ch    = f.CanvasHeight_mm || 0
  if (!cellW || !cellH || !cw || !ch) return f

  const maxCols = Math.max(1, Math.floor((cw + gutX) / (cellW + gutX)))
  const maxRows = Math.max(1, Math.floor((ch + gutY) / (cellH + gutY)))
  const cols = Math.min(f.Cols || 1, maxCols)
  const rows = Math.min(f.Rows || 1, maxRows)

  const gridW = cols * cellW + (cols - 1) * gutX
  const gridH = rows * cellH + (rows - 1) * gutY
  const ml = Math.max(0, Math.round((cw - gridW) / 2 * 100) / 100)
  const mt = Math.max(0, Math.round((ch - gridH) / 2 * 100) / 100)

  return { ...f, Cols: cols, Rows: rows, MarginLeft_mm: ml, MarginRight_mm: ml, MarginTop_mm: mt, MarginBottom_mm: mt }
}

function clampColsRows(f) {
  const cellW = f.CellW_mm || 0
  const cellH = f.CellH_mm || 0
  const gutX  = f.GutterX_mm || 0
  const gutY  = f.GutterY_mm || 0
  const cw    = f.CanvasWidth_mm || 0
  const ch    = f.CanvasHeight_mm || 0
  const ml = f.MarginLeft_mm   || 0
  const mr = f.MarginRight_mm  || 0
  const mt = f.MarginTop_mm    || 0
  const mb = f.MarginBottom_mm || 0
  if (!cellW || !cellH || !cw || !ch) return f

  const availW = cw - ml - mr
  const availH = ch - mt - mb
  if (availW <= 0 || availH <= 0) return f

  const maxCols = Math.max(1, Math.floor((availW + gutX) / (cellW + gutX)))
  const maxRows = Math.max(1, Math.floor((availH + gutY) / (cellH + gutY)))

  return { ...f, Cols: Math.min(f.Cols || 1, maxCols), Rows: Math.min(f.Rows || 1, maxRows) }
}

function autoCode(str) {
  return (str || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function LinkBtn({ linked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={linked ? 'Ontkoppelen' : 'Koppelen'}
      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
        linked ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
      }`}
    >
      {linked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
          <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      )}
    </button>
  )
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function NumField({ label, value, onChange, step = 1, min, unit, readOnly }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 whitespace-nowrap">
        {label}{unit && <span className="font-normal normal-case tracking-normal ml-0.5 text-gray-300">{unit}</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => !readOnly && onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        readOnly={readOnly}
        className={`w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          readOnly ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-gray-200'
        }`}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[100px]">
      <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FormatEditModal({ format, allTags = [], cellPresets = [], canvasPresets = [], backgroundPresets = [], onSave, onClose }) {
  const isNew = !format?.id
  const [form, setForm] = useState({
    Beschrijving: '',
    tags: [],
    Cols: 16,
    Rows: 8,
    CellW_mm: 356,
    CellAspect: 1.667,
    CellH_mm: 213.6,
    GutterX_mm: 80,
    GutterY_mm: 80,
    MarginLeft_mm: 57.5,
    MarginRight_mm: 57.5,
    MarginTop_mm: 36.5,
    MarginBottom_mm: 36.5,
    CanvasWidth_mm: 7900,
    CanvasHeight_mm: 2300,
    ArtboardWidth_mm: 790,
    ArtboardHeight_mm: 230,
    Scale: 0.1,
    Bleed_mm: 1,
    FixedCellSize: true,
    BackgroundColor_Hex: '#050703',
    BackgroundColor_Cmyk: { c: 0, m: 0, y: 0, k: 97 },
    HeaderType: 'NONE',
    HeaderHeight_mm: null,
    HeaderMargin_mm: null,
    DefaultBarType: 'NONE',
    DefaultBarHeight_mm: null,
    DefaultBarGapTop_mm: null,
    DefaultBarGapBottom_mm: null,
    DefaultBarPosition: 'NONE',
    Categorie: 'CUSTOM',
    EventStyle: 'CUSTOM',
    Variant: '',
    Code: '',
    Code_Override: null,
    ArtboardNamePattern: '{Code}',
    LayerPrefix: '{Categorie}',
    PlaceEmpty: 'blank',
    FallbackSymbol: 'BLANK',
    Notes: '',
    ...format,
    tags: format?.tags || [],
    BackgroundColor_Cmyk: format?.BackgroundColor_Cmyk
      || hexToCmyk(format?.BackgroundColor_Hex || '#050703'),
  })

  const [gutterLinked, setGutterLinked] = useState(false)
  const [marginHLinked, setMarginHLinked] = useState(true)
  const [marginVLinked, setMarginVLinked] = useState(true)
  const [canvasLinked, setCanvasLinked] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestOpen, setTagSuggestOpen] = useState(false)
  const [codeManual, setCodeManual] = useState(!isNew)
  const [bleedEnabled, setBleedEnabled] = useState(
    format?.Bleed_mm !== undefined ? format.Bleed_mm > 0 : true
  )

  const FIT_KEYS = ['CanvasWidth_mm', 'CanvasHeight_mm', 'CellW_mm', 'CellAspect', 'GutterX_mm', 'GutterY_mm', 'Cols', 'Rows']
  const MARGIN_KEYS = ['MarginLeft_mm', 'MarginRight_mm', 'MarginTop_mm', 'MarginBottom_mm']

  function set(key, value) {
    setForm(f => {
      let next = { ...f, [key]: value }

      if (key === 'CellW_mm' || key === 'CellAspect') {
        const w = key === 'CellW_mm' ? value : f.CellW_mm
        const a = key === 'CellAspect' ? value : f.CellAspect
        next.CellH_mm = a > 0 ? Math.round((w / a) * 1000) / 1000 : 0
      }
      if (key === 'Scale') {
        next.ArtboardWidth_mm  = Math.round(f.CanvasWidth_mm * value)
        next.ArtboardHeight_mm = Math.round(f.CanvasHeight_mm * value)
      }
      if (key === 'CanvasWidth_mm') {
        next.ArtboardWidth_mm = Math.round(value * f.Scale)
        if (canvasLinked && f.CanvasHeight_mm) {
          const ratio = f.CanvasWidth_mm / f.CanvasHeight_mm
          next.CanvasHeight_mm   = Math.round(value / ratio)
          next.ArtboardHeight_mm = Math.round(next.CanvasHeight_mm * f.Scale)
        }
      }
      if (key === 'CanvasHeight_mm') {
        next.ArtboardHeight_mm = Math.round(value * f.Scale)
        if (canvasLinked && f.CanvasWidth_mm) {
          const ratio = f.CanvasWidth_mm / f.CanvasHeight_mm
          next.CanvasWidth_mm   = Math.round(value * ratio)
          next.ArtboardWidth_mm = Math.round(next.CanvasWidth_mm * f.Scale)
        }
      }
      // Auto-enforce 1:10 wanneer canvas > 5000 mm (Illustrator limiet)
      if ((key === 'CanvasWidth_mm' || key === 'CanvasHeight_mm') &&
          Math.max(next.CanvasWidth_mm, next.CanvasHeight_mm) > 5000 && next.Scale !== 0.1) {
        next.Scale = 0.1
        next.ArtboardWidth_mm  = Math.round(next.CanvasWidth_mm  * 0.1)
        next.ArtboardHeight_mm = Math.round(next.CanvasHeight_mm * 0.1)
        if (bleedEnabled) next.Bleed_mm = 1
      }
      if (key === 'GutterX_mm' && gutterLinked)   next.GutterY_mm      = value
      if (key === 'GutterY_mm' && gutterLinked)   next.GutterX_mm      = value
      if (key === 'MarginLeft_mm'   && marginHLinked) next.MarginRight_mm  = value
      if (key === 'MarginRight_mm'  && marginHLinked) next.MarginLeft_mm   = value
      if (key === 'MarginTop_mm'    && marginVLinked)  next.MarginBottom_mm = value
      if (key === 'MarginBottom_mm' && marginVLinked)  next.MarginTop_mm    = value
      if (key === 'Beschrijving' && !codeManual) next.Code = autoCode(value)
      if (FIT_KEYS.includes(key)) {
        next = fitAndCenter(next)
        next.ArtboardWidth_mm  = Math.round(next.CanvasWidth_mm  * next.Scale)
        next.ArtboardHeight_mm = Math.round(next.CanvasHeight_mm * next.Scale)
      }
      if (MARGIN_KEYS.includes(key)) next = clampColsRows(next)
      return next
    })
  }

  function findMatchingCanvasPreset() {
    return canvasPresets.find(p =>
      p.CanvasWidth_mm === form.CanvasWidth_mm && p.CanvasHeight_mm === form.CanvasHeight_mm
    )?.id || ''
  }

  function applyCanvasPreset(presetId) {
    const preset = canvasPresets.find(p => p.id === presetId)
    if (!preset) return
    setForm(f => {
      const maxDim = Math.max(preset.CanvasWidth_mm, preset.CanvasHeight_mm)
      const newScale = maxDim > 5000 ? 0.1 : f.Scale
      const next = {
        ...f,
        CanvasWidth_mm: preset.CanvasWidth_mm,
        CanvasHeight_mm: preset.CanvasHeight_mm,
        Scale: newScale,
        ArtboardWidth_mm: Math.round(preset.CanvasWidth_mm * newScale),
        ArtboardHeight_mm: Math.round(preset.CanvasHeight_mm * newScale),
        Bleed_mm: bleedEnabled ? 10 * newScale : 0,
      }
      const fitted = fitAndCenter(next)
      fitted.ArtboardWidth_mm  = Math.round(fitted.CanvasWidth_mm  * fitted.Scale)
      fitted.ArtboardHeight_mm = Math.round(fitted.CanvasHeight_mm * fitted.Scale)
      return fitted
    })
  }

  function applyScale(scaleValue) {
    setForm(f => ({
      ...f,
      Scale: scaleValue,
      ArtboardWidth_mm:  Math.round(f.CanvasWidth_mm  * scaleValue),
      ArtboardHeight_mm: Math.round(f.CanvasHeight_mm * scaleValue),
      Bleed_mm: bleedEnabled ? 10 * scaleValue : 0,
    }))
  }

  function toggleBleed(enabled) {
    setBleedEnabled(enabled)
    setForm(f => ({ ...f, Bleed_mm: enabled ? 10 * f.Scale : 0 }))
  }

  function findMatchingCellPreset() {
    if (!cellPresets.length) return ''
    for (const p of cellPresets) {
      const cellMatch =
        Math.abs((p.CellW_mm || 0) - (form.CellW_mm || 0)) < 0.5 &&
        Math.abs((p.CellAspect || 0) - (form.CellAspect || 0)) < 0.005
      const gutterMatch =
        (p.GutterX_mm == null || Math.abs(p.GutterX_mm - (form.GutterX_mm || 0)) < 0.5) &&
        (p.GutterY_mm == null || Math.abs(p.GutterY_mm - (form.GutterY_mm || 0)) < 0.5)
      if (cellMatch && gutterMatch) return p.id
    }
    return ''
  }

  function applyCellPreset(presetId) {
    const preset = cellPresets.find(p => p.id === presetId)
    if (!preset) return
    setForm(f => {
      const cw = preset.CellW_mm
      const ch = Math.round(cw / preset.CellAspect * 1000) / 1000
      const next = { ...f, CellW_mm: cw, CellAspect: preset.CellAspect, CellH_mm: ch,
        ...(preset.GutterX_mm != null && { GutterX_mm: preset.GutterX_mm }),
        ...(preset.GutterY_mm != null && { GutterY_mm: preset.GutterY_mm }) }
      const fitted = fitAndCenter(next)
      fitted.ArtboardWidth_mm  = Math.round(fitted.CanvasWidth_mm  * fitted.Scale)
      fitted.ArtboardHeight_mm = Math.round(fitted.CanvasHeight_mm * fitted.Scale)
      return fitted
    })
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) { setTagInput(''); return }
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t) {
    set('tags', form.tags.filter(tag => tag !== t))
  }

  function handleSave() {
    const id = format?.id || form.Code || `format_${Date.now()}`
    const code = form.Code || autoCode(form.Beschrijving || '')
    onSave({ ...form, id, Code: code, _custom: true })
  }

  const canSave = (form.Beschrijving || '').trim().length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col overflow-hidden"
        style={{ height: 'min(720px, calc(100vh - 48px))' }}
        onMouseDown={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {isNew ? 'Nieuw formaat' : (form.Beschrijving || form.Code || 'Formaat bewerken')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{isNew ? 'Formaat aanmaken' : 'Formaat bewerken'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Links: identiteit */}
          <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col gap-5 p-5 overflow-y-auto">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Naam</label>
              <input
                type="text"
                value={form.Beschrijving ?? ''}
                onChange={e => set('Beschrijving', e.target.value)}
                placeholder="Bv. Backdrop Flash interview"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Code
                {!codeManual && <span className="ml-1 font-normal normal-case tracking-normal text-gray-300">(auto)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.Code ?? ''}
                  onChange={e => { setCodeManual(true); set('Code', e.target.value.toUpperCase()) }}
                  placeholder={autoCode(form.Beschrijving || '')}
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono bg-white"
                />
                {codeManual && (
                  <button type="button"
                    onClick={() => { setCodeManual(false); set('Code', autoCode(form.Beschrijving || '')) }}
                    className="flex-shrink-0 text-xs px-2 py-1.5 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg bg-white transition-colors">
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Tags</label>
              <div className="flex flex-wrap gap-1.5 min-h-5">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2L2 8"/>
                      </svg>
                    </button>
                  </span>
                ))}
                {form.tags.length === 0 && <span className="text-xs text-gray-300 italic">Nog geen tags</span>}
              </div>
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => { setTagInput(e.target.value); setTagSuggestOpen(true) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(); setTagSuggestOpen(false) }
                      if (e.key === 'Escape') setTagSuggestOpen(false)
                    }}
                    onFocus={() => setTagSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setTagSuggestOpen(false), 150)}
                    placeholder="Tag toevoegen…"
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  />
                  <button type="button" onClick={() => { addTag(); setTagSuggestOpen(false) }}
                    className="px-3 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    +
                  </button>
                </div>
                {tagSuggestOpen && (() => {
                  const q = tagInput.trim().toLowerCase()
                  const suggestions = allTags.filter(t =>
                    !form.tags.includes(t) && (q === '' || t.includes(q))
                  ).slice(0, 8)
                  return suggestions.length > 0 ? (
                    <div className="absolute z-10 top-full left-0 right-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {suggestions.map(t => (
                        <button key={t} type="button"
                          onMouseDown={e => { e.preventDefault(); set('tags', [...form.tags, t]); setTagInput(''); setTagSuggestOpen(false) }}
                          className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            </div>

            <FormatPreview form={form} />

            <div className="space-y-2 text-[11px] text-gray-400 pt-1">
              <div className="flex justify-between">
                <span>Grid</span>
                <span className="text-gray-600 font-medium">{form.Cols} × {form.Rows}</span>
              </div>
              <div className="flex justify-between">
                <span>Canvas</span>
                <span className="text-gray-600 font-medium">{form.CanvasWidth_mm} × {form.CanvasHeight_mm} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Cel</span>
                <span className="text-gray-600 font-medium">{form.CellW_mm} × {form.CellH_mm} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Gutter</span>
                <span className="text-gray-600 font-medium">{form.GutterX_mm} / {form.GutterY_mm} mm</span>
              </div>
            </div>

          </div>

          {/* Rechts: instellingen (één scroll) */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">

              {/* Canvas */}
              <div>
                <SectionHeading>Canvas</SectionHeading>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5 max-w-[200px]">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Preset</label>
                    <select
                      value={findMatchingCanvasPreset()}
                      onChange={e => applyCanvasPreset(e.target.value)}
                      disabled={canvasPresets.length === 0}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{canvasPresets.length === 0 ? '— Geen presets —' : '— Aangepast —'}</option>
                      {canvasPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <NumField label="Breedte" value={form.CanvasWidth_mm} onChange={v => set('CanvasWidth_mm', v)} step={10} unit="mm" />
                    <LinkBtn linked={canvasLinked} onToggle={() => setCanvasLinked(v => !v)} />
                    <NumField label="Hoogte" value={form.CanvasHeight_mm} onChange={v => set('CanvasHeight_mm', v)} step={10} unit="mm" />
                  </div>
                  {/* Schaal — 3 vaste opties */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Schaal</label>
                    <div className="flex gap-1.5">
                      {[{ label: '1:1', value: 1 }, { label: '1:2', value: 0.5 }, { label: '1:10', value: 0.1 }].map(s => {
                        const forced10 = Math.max(form.CanvasWidth_mm, form.CanvasHeight_mm) > 5000
                        const disabled = forced10 && s.value !== 0.1
                        const active   = Math.abs(form.Scale - s.value) < 0.001
                        return (
                          <button key={s.value} type="button"
                            onClick={() => !disabled && applyScale(s.value)}
                            disabled={disabled}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                              active    ? 'bg-blue-600 text-white border-blue-600' :
                              disabled  ? 'border-gray-100 text-gray-300 cursor-not-allowed' :
                                          'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                    {Math.max(form.CanvasWidth_mm, form.CanvasHeight_mm) > 5000 && (
                      <p className="text-[10px] text-amber-500">Canvas {'>'} 5000 mm — 1:10 verplicht</p>
                    )}
                  </div>

                  {/* Bleed — aan/uit */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Bleed</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {bleedEnabled ? `${10 * form.Scale} mm rondom` : 'Uitgeschakeld'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBleed(!bleedEnabled)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                        bleedEnabled ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        bleedEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400">
                    Artboard:{' '}
                    <span className="font-medium text-gray-600">{form.ArtboardWidth_mm} × {form.ArtboardHeight_mm} mm</span>
                    <span className="ml-1.5 text-gray-300">(Canvas × Schaal)</span>
                  </p>

                  {/* Aanpassingsmodus */}
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                      {form.FixedCellSize ? 'Cellen vast, raster past' : 'Raster vast, cellen passen'}
                    </p>
                    <button
                      type="button"
                      onClick={() => set('FixedCellSize', !form.FixedCellSize)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                        form.FixedCellSize ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.FixedCellSize ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid & Cel */}
              <div>
                <SectionHeading>Grid & Cel</SectionHeading>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5 max-w-[200px]">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Preset</label>
                    <select
                      value={findMatchingCellPreset()}
                      onChange={e => applyCellPreset(e.target.value)}
                      disabled={cellPresets.length === 0}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{cellPresets.length === 0 ? '— Geen presets —' : '— Aangepast —'}</option>
                      {cellPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                    <NumField label="Kolommen" value={form.Cols} onChange={v => set('Cols', Math.max(1, Math.round(v)))} step={1} min={1} />
                    <NumField label="Rijen" value={form.Rows} onChange={v => set('Rows', Math.max(1, Math.round(v)))} step={1} min={1} />
                  </div>
                  <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                    <NumField label="Breedte" value={form.CellW_mm} onChange={v => set('CellW_mm', v)} step={1} unit="mm" />
                    <NumField label="Verhouding" value={form.CellAspect} onChange={v => set('CellAspect', v)} step={0.001} />
                    <NumField label="Hoogte" value={form.CellH_mm} onChange={() => {}} unit="mm" readOnly />
                  </div>
                </div>
              </div>

              {/* Gutter & Marges */}
              <div>
                <SectionHeading>Gutter & Marges</SectionHeading>
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <NumField label="Gutter X" value={form.GutterX_mm} onChange={v => set('GutterX_mm', v)} step={1} unit="mm" />
                    <LinkBtn linked={gutterLinked} onToggle={() => setGutterLinked(v => !v)} />
                    <NumField label="Gutter Y" value={form.GutterY_mm} onChange={v => set('GutterY_mm', v)} step={1} unit="mm" />
                  </div>
                  <div className="flex items-end gap-2">
                    <NumField label="Links" value={form.MarginLeft_mm} onChange={v => set('MarginLeft_mm', v)} step={0.5} unit="mm" />
                    <LinkBtn linked={marginHLinked} onToggle={() => setMarginHLinked(v => !v)} />
                    <NumField label="Rechts" value={form.MarginRight_mm} onChange={v => set('MarginRight_mm', v)} step={0.5} unit="mm" />
                  </div>
                  <div className="flex items-end gap-2">
                    <NumField label="Boven" value={form.MarginTop_mm} onChange={v => set('MarginTop_mm', v)} step={0.5} unit="mm" />
                    <LinkBtn linked={marginVLinked} onToggle={() => setMarginVLinked(v => !v)} />
                    <NumField label="Onder" value={form.MarginBottom_mm} onChange={v => set('MarginBottom_mm', v)} step={0.5} unit="mm" />
                  </div>
                  <p className="text-xs text-gray-300">Marges worden automatisch herberekend wanneer canvas, cel of gutter wijzigt.</p>
                </div>
              </div>

              {/* Achtergrond */}
              <div>
                <SectionHeading>Achtergrond</SectionHeading>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5 max-w-[200px]">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Preset</label>
                    <select
                      value={backgroundPresets.find(p => p.BackgroundColor_Hex === form.BackgroundColor_Hex)?.id || ''}
                      onChange={e => {
                        const p = backgroundPresets.find(x => x.id === e.target.value)
                        if (p) setForm(f => ({ ...f, BackgroundColor_Hex: p.BackgroundColor_Hex, BackgroundColor_Cmyk: p.BackgroundColor_Cmyk }))
                      }}
                      disabled={backgroundPresets.length === 0}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{backgroundPresets.length === 0 ? '— Geen presets —' : '— Aangepast —'}</option>
                      {backgroundPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      HEX <span className="font-normal normal-case text-gray-300">(online)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.BackgroundColor_Hex || '#050703'}
                        onChange={e => set('BackgroundColor_Hex', e.target.value)}
                        className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={form.BackgroundColor_Hex || ''}
                        onChange={e => set('BackgroundColor_Hex', e.target.value)}
                        className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => set('BackgroundColor_Cmyk', hexToCmyk(form.BackgroundColor_Hex))}
                        className="ml-auto text-xs text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        → CMYK
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      CMYK <span className="font-normal normal-case text-gray-300">(druk)</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-w-[200px]">
                      {['c', 'm', 'y', 'k'].map(ch => (
                        <div key={ch} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium uppercase text-gray-400 text-center">{ch}</label>
                          <input
                            type="number"
                            min={0} max={100} step={1}
                            value={form.BackgroundColor_Cmyk?.[ch] ?? 0}
                            onChange={e => set('BackgroundColor_Cmyk', {
                              ...form.BackgroundColor_Cmyk,
                              [ch]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                            })}
                            className="w-full border border-gray-200 rounded-lg px-1.5 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div>
                <SectionHeading>Header</SectionHeading>
                <div className="space-y-3">
                  <SelectField
                    label="Type"
                    value={form.HeaderType}
                    onChange={v => set('HeaderType', v)}
                    options={['NONE', 'BAR', 'LOGO', 'CUSTOM']}
                  />
                  {form.HeaderType !== 'NONE' && (
                    <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                      <NumField label="Hoogte" value={form.HeaderHeight_mm} onChange={v => set('HeaderHeight_mm', v)} step={1} unit="mm" />
                      <NumField label="Marge" value={form.HeaderMargin_mm} onChange={v => set('HeaderMargin_mm', v)} step={1} unit="mm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Divider bar */}
              <div>
                <SectionHeading>Divider bar</SectionHeading>
                <div className="space-y-3">
                  <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                    <SelectField
                      label="Type"
                      value={form.DefaultBarType}
                      onChange={v => set('DefaultBarType', v)}
                      options={['NONE', 'BAR', 'LINE']}
                    />
                    <SelectField
                      label="Positie"
                      value={form.DefaultBarPosition}
                      onChange={v => set('DefaultBarPosition', v)}
                      options={['NONE', 'TOP', 'BOTTOM', 'BOTH']}
                    />
                  </div>
                  {form.DefaultBarType !== 'NONE' && (
                    <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                      <NumField label="Hoogte" value={form.DefaultBarHeight_mm} onChange={v => set('DefaultBarHeight_mm', v)} step={1} unit="mm" />
                      <NumField label="Gap boven" value={form.DefaultBarGapTop_mm} onChange={v => set('DefaultBarGapTop_mm', v)} step={1} unit="mm" />
                      <NumField label="Gap onder" value={form.DefaultBarGapBottom_mm} onChange={v => set('DefaultBarGapBottom_mm', v)} step={1} unit="mm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Illustrator & Metadata */}
              <div>
                <SectionHeading>Illustrator & Metadata</SectionHeading>
                <div className="space-y-3">
                  <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                    <TextField label="Categorie" value={form.Categorie} onChange={v => set('Categorie', v)} />
                    <TextField label="Event style" value={form.EventStyle} onChange={v => set('EventStyle', v)} />
                    <TextField label="Variant" value={form.Variant} onChange={v => set('Variant', v)} placeholder="Bv. WIDE" />
                  </div>
                  <div className="flex items-end gap-x-4 gap-y-3 flex-wrap">
                    <TextField label="Artboard naampatroon" value={form.ArtboardNamePattern} onChange={v => set('ArtboardNamePattern', v)} />
                    <TextField label="Laag prefix" value={form.LayerPrefix} onChange={v => set('LayerPrefix', v)} />
                  </div>
                </div>
              </div>

              {/* Notities */}
              <div>
                <SectionHeading>Notities</SectionHeading>
                <textarea
                  value={form.Notes ?? ''}
                  onChange={e => set('Notes', e.target.value)}
                  rows={4}
                  placeholder="Interne notities over dit formaat..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNew ? 'Aanmaken' : 'Opslaan'}
          </button>
        </div>

      </div>
    </div>
  )
}
