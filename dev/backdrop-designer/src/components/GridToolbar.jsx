import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Helper: parse DefaultBarPosition string → { type, row }
function parseBarPosition(val) {
  if (!val || val === 'NONE') return { type: 'NONE', row: '' }
  if (val === 'TOP') return { type: 'TOP', row: '' }
  if (val === 'BOTTOM') return { type: 'BOTTOM', row: '' }
  const m = val.match(/^AFTER_ROW=(\d+)$/)
  if (m) return { type: 'AFTER_ROW', row: m[1] }
  return { type: 'NONE', row: '' }
}

function serializeBarPosition(type, row) {
  if (type === 'AFTER_ROW') return `AFTER_ROW=${row || 1}`
  return type
}

function NumInput({ label, value, onChange, unit = 'mm', min, step = 1, readOnly, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : 'min-w-[52px]'}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none whitespace-nowrap">
        {label}
      </span>
      <div className="flex items-center gap-0.5">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          step={step}
          readOnly={readOnly}
          onChange={e => !readOnly && onChange(parseFloat(e.target.value) || 0)}
          className={`text-xs px-1.5 py-1 border rounded text-right tabular-nums
            ${wide ? 'w-full' : 'w-14'}
            ${readOnly
              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
              : 'border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-red-300'
            }`}
        />
        {unit && <span className="text-[9px] text-gray-300">{unit}</span>}
      </div>
    </label>
  )
}

function IntInput({ label, value, onChange, min = 1, max, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : 'min-w-[44px]'}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={1}
        onChange={e => {
          const v = parseInt(e.target.value) || min
          const clamped = max !== undefined ? Math.min(v, max) : v
          onChange(Math.max(min, clamped))
        }}
        className={`text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300 text-right tabular-nums ${wide ? 'w-full' : 'w-12'}`}
      />
    </label>
  )
}

function SelectInput({ label, value, options, onChange, wide }) {
  return (
    <label className={`flex flex-col gap-0.5 ${wide ? 'flex-1 min-w-0' : ''}`}>
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</span>
      <select
        value={value ?? 'NONE'}
        onChange={e => onChange(e.target.value)}
        className={`text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300 ${wide ? 'w-full' : ''}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function LinkBtn({ linked, onToggle, title, vertical }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={`flex-shrink-0 p-1 rounded transition-colors ${vertical ? 'self-end mb-1' : 'self-end mb-1'}
        ${linked
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
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

// Horizontal layout helpers
function Sep() {
  return <div className="w-px bg-gray-200 self-stretch mx-1 flex-shrink-0" />
}

function BgColorInput({ format, set }) {
  const [hexText, setHexText] = useState(format.BackgroundColor_Hex || '#000000')

  useEffect(() => {
    setHexText(format.BackgroundColor_Hex || '#000000')
  }, [format.BackgroundColor_Hex])

  function handleColorPicker(val) {
    set('BackgroundColor_Hex', val)
    setHexText(val)
  }

  function handleHexInput(val) {
    setHexText(val)
    var norm = val.startsWith('#') ? val : '#' + val
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) set('BackgroundColor_Hex', norm.toLowerCase())
  }

  function handleHexBlur() {
    var norm = hexText.startsWith('#') ? hexText : '#' + hexText
    if (/^#[0-9a-fA-F]{6}$/.test(norm)) setHexText(norm.toLowerCase())
    else setHexText(format.BackgroundColor_Hex || '#000000')
  }

  function handleCmyk(ch, val) {
    var n = Math.max(0, Math.min(100, parseInt(val) || 0))
    set('BackgroundColor_' + ch, n)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Achtergrond</span>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={format.BackgroundColor_Hex || '#000000'}
            onChange={e => handleColorPicker(e.target.value)}
            className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
          />
          <input
            type="text"
            value={hexText}
            onChange={e => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            spellCheck={false}
            maxLength={7}
            className="text-xs font-mono px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300 w-20"
          />
        </div>
      </label>
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">CMYK</span>
        <div className="grid grid-cols-4 gap-1">
          {['C', 'M', 'Y', 'K'].map(function(ch) {
            return (
              <label key={ch} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-gray-400 text-center">{ch}</span>
                <input
                  type="number" min={0} max={100} step={1}
                  value={format['BackgroundColor_' + ch] ?? ''}
                  onChange={e => handleCmyk(ch, e.target.value)}
                  className="text-xs px-1 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300 w-full text-right tabular-nums"
                />
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Group({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">{label}</span>
      <div className="flex items-end gap-2">{children}</div>
    </div>
  )
}

// Vertical layout helpers
function VSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 group bg-white"
      >
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          className={`text-gray-300 group-hover:text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`}
        >
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-3 pb-3 pt-1 border-t border-gray-100 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VRow({ children }) {
  return <div className="flex items-end gap-1.5">{children}</div>
}

const HEADER_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TEXT', label: 'Tekst' },
  { value: 'SYMBOL', label: 'Symbool' },
  { value: 'TEXT_SOCIAL', label: 'Tekst + Social' },
  { value: 'GRAPHIC', label: 'Grafisch' },
]

const BAR_TYPE_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TEXT', label: 'Tekst' },
  { value: 'SYMBOL', label: 'Symbool' },
]

const BAR_POS_OPTIONS = [
  { value: 'NONE', label: 'Geen' },
  { value: 'TOP', label: 'Boven' },
  { value: 'BOTTOM', label: 'Onder' },
  { value: 'AFTER_ROW', label: 'Na rij...' },
]

const PLACE_EMPTY_OPTIONS = [
  { value: 'blank', label: 'Placeholder' },
  { value: 'skip', label: 'Overslaan' },
]

// ─── withFittedCells ─────────────────────────────────────────────────────────
function withFittedAndCentered(fmt) {
  if (!fmt.CanvasWidth_mm || !fmt.CanvasHeight_mm) return fmt

  const cols   = fmt.Cols || 1
  const rows   = fmt.Rows || 1
  const gx     = fmt.GutterX_mm || 0
  const gy     = fmt.GutterY_mm || 0
  const aspect = fmt.CellAspect || 1.667
  const ml     = fmt.MarginLeft_mm   || 0
  const mr     = fmt.MarginRight_mm  || 0
  const mt     = fmt.MarginTop_mm    || 0
  const mb     = fmt.MarginBottom_mm || 0

  const availW = fmt.CanvasWidth_mm  - ml - mr
  const availH = fmt.CanvasHeight_mm - mt - mb
  if (availW <= 0 || availH <= 0) return fmt

  const maxCellW = (availW - (cols - 1) * gx) / cols
  const maxCellH = (availH - (rows - 1) * gy) / rows

  let cw = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0
  let ch = cw / aspect

  if (maxCellW > 0 && cw > maxCellW) { cw = maxCellW; ch = cw / aspect }
  if (maxCellH > 0 && ch > maxCellH) { ch = maxCellH; cw = ch * aspect }

  const result = { ...fmt }
  result.TargetCellW_mm = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0
  result.CellW_mm = Math.round(cw * 100) / 100
  result.CellH_mm = Math.round(ch * 1000) / 1000
  return result
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GridToolbar({ format, onChange, cellPresets = [], canvasPresets = [], layout = 'horizontal' }) {
  const [canvasLinked, setCanvasLinked] = useState(false)
  const [gutterLinked, setGutterLinked] = useState(true)
  const [lastChangedGutter, setLastChangedGutter] = useState('x')
  const [marginLinkedH, setMarginLinkedH] = useState(true)
  const [marginLinkedV, setMarginLinkedV] = useState(true)
  const [lastChangedMarginH, setLastChangedMarginH] = useState('l')
  const [lastChangedMarginV, setLastChangedMarginV] = useState('t')

  const barPos    = parseBarPosition(format.DefaultBarPosition)
  const hasHeader = format.HeaderType && format.HeaderType !== 'NONE'
  const hasBar    = format.DefaultBarType && format.DefaultBarType !== 'NONE'

  const cellH = format.CellW_mm && format.CellAspect
    ? Math.round((format.CellW_mm / format.CellAspect) * 1000) / 1000
    : format.CellH_mm

  function findMatchingPreset() {
    if (!cellPresets || cellPresets.length === 0) return ''
    for (const p of cellPresets) {
      const cellMatch =
        Math.abs((p.CellW_mm || 0) - (format.CellW_mm || 0)) < 0.5 &&
        Math.abs((p.CellAspect || 0) - (format.CellAspect || 0)) < 0.005
      const gutterMatch =
        (p.GutterX_mm == null || Math.abs(p.GutterX_mm - (format.GutterX_mm || 0)) < 0.5) &&
        (p.GutterY_mm == null || Math.abs(p.GutterY_mm - (format.GutterY_mm || 0)) < 0.5)
      if (cellMatch && gutterMatch) return p.id
    }
    return ''
  }

  function applyPreset(presetId) {
    const preset = cellPresets.find(p => p.id === presetId)
    if (!preset) return
    const cw = preset.CellW_mm
    const ch = Math.round(cw / preset.CellAspect * 1000) / 1000
    const gx = preset.GutterX_mm ?? format.GutterX_mm ?? 0
    const gy = preset.GutterY_mm ?? format.GutterY_mm ?? 0
    const ml = format.MarginLeft_mm  || 0
    const mr = format.MarginRight_mm || 0
    const mt = format.MarginTop_mm   || 0
    const mb = format.MarginBottom_mm || 0
    const availW = (format.CanvasWidth_mm  || 0) - ml - mr
    const availH = (format.CanvasHeight_mm || 0) - mt - mb
    const maxCols = Math.max(1, Math.floor((availW + gx) / (cw + gx)))
    const maxRows = Math.max(1, Math.floor((availH + gy) / (ch + gy)))
    const updated = {
      ...format,
      CellW_mm: cw, CellAspect: preset.CellAspect, CellH_mm: ch,
      TargetCellW_mm: cw, Cols: maxCols, Rows: maxRows,
      ...(preset.GutterX_mm != null && { GutterX_mm: preset.GutterX_mm }),
      ...(preset.GutterY_mm != null && { GutterY_mm: preset.GutterY_mm }),
    }
    onChange(withFittedAndCentered(updated))
  }

  function set(key, value) { onChange({ ...format, [key]: value }) }
  function setBarPosType(type) { onChange({ ...format, DefaultBarPosition: serializeBarPosition(type, barPos.row) }) }
  function setBarPosRow(row) { onChange({ ...format, DefaultBarPosition: serializeBarPosition('AFTER_ROW', row) }) }

  function handleColsChange(newCols) { onChange(withFittedAndCentered({ ...format, Cols: Math.max(1, newCols) })) }
  function handleRowsChange(newRows) { onChange(withFittedAndCentered({ ...format, Rows: Math.max(1, newRows) })) }

  function handleCellWChange(v) {
    const newH = Math.round(v / (format.CellAspect || 1.667) * 1000) / 1000
    onChange(withFittedAndCentered({ ...format, CellW_mm: v, CellH_mm: newH, TargetCellW_mm: v }))
  }

  function handleGutterXChange(v) {
    setLastChangedGutter('x')
    onChange(withFittedAndCentered(gutterLinked ? { ...format, GutterX_mm: v, GutterY_mm: v } : { ...format, GutterX_mm: v }))
  }
  function handleGutterYChange(v) {
    setLastChangedGutter('y')
    onChange(withFittedAndCentered(gutterLinked ? { ...format, GutterY_mm: v, GutterX_mm: v } : { ...format, GutterY_mm: v }))
  }
  function handleGutterLinkToggle() {
    if (!gutterLinked) {
      onChange(withFittedAndCentered(lastChangedGutter === 'y' ? { ...format, GutterX_mm: format.GutterY_mm } : { ...format, GutterY_mm: format.GutterX_mm }))
    }
    setGutterLinked(v => !v)
  }

  function handleMarginLChange(v) {
    setLastChangedMarginH('l')
    onChange(withFittedAndCentered(marginLinkedH ? { ...format, MarginLeft_mm: v, MarginRight_mm: v } : { ...format, MarginLeft_mm: v }))
  }
  function handleMarginRChange(v) {
    setLastChangedMarginH('r')
    onChange(withFittedAndCentered(marginLinkedH ? { ...format, MarginRight_mm: v, MarginLeft_mm: v } : { ...format, MarginRight_mm: v }))
  }
  function handleMarginTChange(v) {
    setLastChangedMarginV('t')
    onChange(withFittedAndCentered(marginLinkedV ? { ...format, MarginTop_mm: v, MarginBottom_mm: v } : { ...format, MarginTop_mm: v }))
  }
  function handleMarginBChange(v) {
    setLastChangedMarginV('b')
    onChange(withFittedAndCentered(marginLinkedV ? { ...format, MarginBottom_mm: v, MarginTop_mm: v } : { ...format, MarginBottom_mm: v }))
  }
  function handleMarginLinkHToggle() {
    if (!marginLinkedH) {
      onChange(withFittedAndCentered(lastChangedMarginH === 'r' ? { ...format, MarginLeft_mm: format.MarginRight_mm } : { ...format, MarginRight_mm: format.MarginLeft_mm }))
    }
    setMarginLinkedH(v => !v)
  }
  function handleMarginLinkVToggle() {
    if (!marginLinkedV) {
      onChange(withFittedAndCentered(lastChangedMarginV === 'b' ? { ...format, MarginTop_mm: format.MarginBottom_mm } : { ...format, MarginBottom_mm: format.MarginTop_mm }))
    }
    setMarginLinkedV(v => !v)
  }

  // ─── Vertical layout ─────────────────────────────────────────────────────────
  if (layout === 'vertical') {
    return (
      <div className="flex flex-col gap-2">

        {/* Canvas */}
        <VSection label="Canvas">
          {canvasPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={canvasPresets.find(p => p.CanvasWidth_mm === format.CanvasWidth_mm && p.CanvasHeight_mm === format.CanvasHeight_mm)?.id || ''}
                onChange={e => {
                  const p = canvasPresets.find(x => x.id === e.target.value)
                  if (p) onChange({ ...format, CanvasWidth_mm: p.CanvasWidth_mm, CanvasHeight_mm: p.CanvasHeight_mm })
                }}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300"
              >
                <option value="">— Aangepast —</option>
                {canvasPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <VRow>
            <NumInput label="Breedte" value={format.CanvasWidth_mm} step={1} min={1} onChange={v => {
              const next = { ...format, CanvasWidth_mm: v }
              if (canvasLinked && format.CanvasWidth_mm) next.CanvasHeight_mm = Math.round(v / format.CanvasWidth_mm * format.CanvasHeight_mm)
              onChange(next)
            }} wide />
            <LinkBtn linked={canvasLinked} onToggle={() => setCanvasLinked(v => !v)}
              title={canvasLinked ? 'Verhouding vergrendeld' : 'Vrije afmetingen'} />
            <NumInput label="Hoogte" value={format.CanvasHeight_mm} step={1} min={1} onChange={v => {
              const next = { ...format, CanvasHeight_mm: v }
              if (canvasLinked && format.CanvasHeight_mm) next.CanvasWidth_mm = Math.round(v / format.CanvasHeight_mm * format.CanvasWidth_mm)
              onChange(next)
            }} wide />
          </VRow>
        </VSection>

        {/* Grid + Gutter */}
        <VSection label="Grid">
          {cellPresets && cellPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={findMatchingPreset()}
                onChange={e => applyPreset(e.target.value)}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300"
              >
                <option value="">— Aangepast —</option>
                {cellPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <VRow>
            <IntInput label="Kolommen" value={format.Cols} min={1} onChange={handleColsChange} wide />
            <IntInput label="Rijen" value={format.Rows} min={1} onChange={handleRowsChange} wide />
          </VRow>
          <VRow>
            <NumInput label="Celbreedte" value={format.CellW_mm} step={0.1} onChange={handleCellWChange} wide />
            <NumInput label="Celhoogte" value={cellH} readOnly wide />
          </VRow>
          <div className="h-px bg-gray-100 -mx-3" />
          <VRow>
            <NumInput label="Gutter H" value={format.GutterX_mm} step={0.5} onChange={handleGutterXChange} wide />
            <LinkBtn linked={gutterLinked} onToggle={handleGutterLinkToggle}
              title={gutterLinked ? 'Gelinkt — klik om los te koppelen' : 'Los — klik om te linken'} />
            <NumInput label="Gutter V" value={format.GutterY_mm} step={0.5} onChange={handleGutterYChange} wide />
          </VRow>
        </VSection>

        {/* Marges */}
        <VSection label="Marges">
          <VRow>
            <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} min={0} onChange={handleMarginLChange} wide />
            <LinkBtn linked={marginLinkedH} onToggle={handleMarginLinkHToggle}
              title={marginLinkedH ? 'Links↔Rechts gelinkt' : 'Los'} />
            <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} min={0} onChange={handleMarginRChange} wide />
          </VRow>
          <VRow>
            <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} min={0} onChange={handleMarginTChange} wide />
            <LinkBtn linked={marginLinkedV} onToggle={handleMarginLinkVToggle}
              title={marginLinkedV ? 'Boven↔Onder gelinkt' : 'Los'} />
            <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} min={0} onChange={handleMarginBChange} wide />
          </VRow>
        </VSection>

        {/* Header */}
        <VSection label="Header">
          <SelectInput label="Type" value={format.HeaderType || 'NONE'} options={HEADER_OPTIONS}
            onChange={v => set('HeaderType', v)} wide />
          {hasHeader && (
            <VRow>
              <NumInput label="Hoogte" value={format.HeaderHeight_mm} step={1} onChange={v => set('HeaderHeight_mm', v)} wide />
              <NumInput label="Marge" value={format.HeaderMargin_mm} step={0.5} onChange={v => set('HeaderMargin_mm', v)} wide />
            </VRow>
          )}
        </VSection>

        {/* Divider */}
        <VSection label="Divider">
          <SelectInput label="Type" value={format.DefaultBarType || 'NONE'} options={BAR_TYPE_OPTIONS}
            onChange={v => set('DefaultBarType', v)} wide />
          {hasBar && (
            <>
              <VRow>
                <SelectInput label="Positie" value={barPos.type} options={BAR_POS_OPTIONS}
                  onChange={setBarPosType} wide />
                {barPos.type === 'AFTER_ROW' && (
                  <IntInput label="Na rij" value={barPos.row} min={1} max={format.Rows - 1}
                    onChange={setBarPosRow} wide />
                )}
              </VRow>
              <VRow>
                <NumInput label="Hoogte" value={format.DefaultBarHeight_mm} step={1} onChange={v => set('DefaultBarHeight_mm', v)} wide />
                <NumInput label="Gap ↑" value={format.DefaultBarGapTop_mm} step={0.5} onChange={v => set('DefaultBarGapTop_mm', v)} wide />
                <NumInput label="Gap ↓" value={format.DefaultBarGapBottom_mm} step={0.5} onChange={v => set('DefaultBarGapBottom_mm', v)} wide />
              </VRow>
            </>
          )}
        </VSection>

        {/* Stijl */}
        <VSection label="Stijl">
          <BgColorInput format={format} set={set} />
          <SelectInput label="Leeg slot" value={format.PlaceEmpty || 'blank'} options={PLACE_EMPTY_OPTIONS}
            onChange={v => set('PlaceEmpty', v)} wide />
        </VSection>

      </div>
    )
  }

  // ─── Horizontal layout (original) ────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto flex-shrink-0">
      <div className="flex items-end gap-3 min-w-max">

        <Group label="Grid">
          {cellPresets && cellPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={findMatchingPreset()}
                onChange={e => applyPreset(e.target.value)}
                className="text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-300 max-w-[120px]"
              >
                <option value="">— Aangepast —</option>
                {cellPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <IntInput label="Kolommen" value={format.Cols} min={1} onChange={handleColsChange} />
          <IntInput label="Rijen" value={format.Rows} min={1} onChange={handleRowsChange} />
        </Group>

        <Sep />

        <Group label="Cel">
          <NumInput label="Breedte" value={format.CellW_mm} step={0.1} onChange={handleCellWChange} />
          <NumInput label="Hoogte" value={cellH} unit="mm" readOnly />
        </Group>

        <Sep />

        <Group label="Gutter">
          <NumInput label="Horiz" value={format.GutterX_mm} step={0.5} onChange={handleGutterXChange} />
          <LinkBtn linked={gutterLinked} onToggle={handleGutterLinkToggle}
            title={gutterLinked ? 'Horiz en Vert zijn gelinkt' : 'Horiz en Vert zijn los'} />
          <NumInput label="Vert" value={format.GutterY_mm} step={0.5} onChange={handleGutterYChange} />
        </Group>

        <Sep />

        <Group label="Marges">
          <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} min={0} onChange={handleMarginLChange} />
          <LinkBtn linked={marginLinkedH} onToggle={handleMarginLinkHToggle}
            title={marginLinkedH ? 'Links en Rechts gelinkt' : 'Links en Rechts los'} />
          <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} min={0} onChange={handleMarginRChange} />
          <Sep />
          <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} min={0} onChange={handleMarginTChange} />
          <LinkBtn linked={marginLinkedV} onToggle={handleMarginLinkVToggle}
            title={marginLinkedV ? 'Boven en Onder gelinkt' : 'Boven en Onder los'} />
          <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} min={0} onChange={handleMarginBChange} />
        </Group>

        <Sep />

        <Group label="Header">
          <SelectInput label="Type" value={format.HeaderType || 'NONE'} options={HEADER_OPTIONS}
            onChange={v => set('HeaderType', v)} />
          {hasHeader && <>
            <NumInput label="Hoogte" value={format.HeaderHeight_mm} step={1} onChange={v => set('HeaderHeight_mm', v)} />
            <NumInput label="Marge" value={format.HeaderMargin_mm} step={0.5} onChange={v => set('HeaderMargin_mm', v)} />
          </>}
        </Group>

        <Sep />

        <Group label="Divider">
          <SelectInput label="Type" value={format.DefaultBarType || 'NONE'} options={BAR_TYPE_OPTIONS}
            onChange={v => set('DefaultBarType', v)} />
          {hasBar && <>
            <SelectInput label="Positie" value={barPos.type} options={BAR_POS_OPTIONS}
              onChange={setBarPosType} />
            {barPos.type === 'AFTER_ROW' && (
              <IntInput label="Na rij" value={barPos.row} min={1} max={format.Rows - 1}
                onChange={setBarPosRow} />
            )}
            <NumInput label="Hoogte" value={format.DefaultBarHeight_mm} step={1} onChange={v => set('DefaultBarHeight_mm', v)} />
            <NumInput label="Gap ↑" value={format.DefaultBarGapTop_mm} step={0.5} onChange={v => set('DefaultBarGapTop_mm', v)} />
            <NumInput label="Gap ↓" value={format.DefaultBarGapBottom_mm} step={0.5} onChange={v => set('DefaultBarGapBottom_mm', v)} />
          </>}
        </Group>

        <Sep />

        <Group label="Stijl">
          <BgColorInput format={format} set={set} />
          <SelectInput label="Leeg slot" value={format.PlaceEmpty || 'blank'} options={PLACE_EMPTY_OPTIONS}
            onChange={v => set('PlaceEmpty', v)} />
        </Group>

      </div>
    </div>
  )
}
