import { useState } from 'react'

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

// Compact number input
function NumInput({ label, value, onChange, unit = 'mm', min, step = 1, readOnly }) {
  return (
    <label className="flex flex-col gap-0.5 min-w-[52px]">
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
          className={`w-14 text-xs px-1.5 py-1 border rounded text-right tabular-nums
            ${readOnly
              ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
              : 'border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400'
            }`}
        />
        {unit && <span className="text-[9px] text-gray-300">{unit}</span>}
      </div>
    </label>
  )
}

// Compact integer input (no decimals)
function IntInput({ label, value, onChange, min = 1, max }) {
  return (
    <label className="flex flex-col gap-0.5 min-w-[44px]">
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
        className="w-12 text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-right tabular-nums"
      />
    </label>
  )
}

// Compact select
function SelectInput({ label, value, options, onChange }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</span>
      <select
        value={value ?? 'NONE'}
        onChange={e => onChange(e.target.value)}
        className="text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// Link toggle button — chain icon
function LinkBtn({ linked, onToggle, title }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={title}
      className={`self-end mb-1 p-1 rounded transition-colors ${
        linked
          ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
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

// Group separator
function Sep() {
  return <div className="w-px bg-gray-200 self-stretch mx-1 flex-shrink-0" />
}

// Group wrapper
function Group({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">{label}</span>
      <div className="flex items-end gap-2">{children}</div>
    </div>
  )
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
// Margins are ABSOLUTE — they never change automatically.
// If cols/rows/gutter would push cells outside the available space,
// cell size shrinks to fit (aspect ratio preserved). Gutters stay the same.
// When cols/rows decrease, cells stay at their current size; the extra space
// becomes visual margin but the margin values in the toolbar stay unchanged.
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

  // Use TargetCellW_mm as the intended size so cells spring back when space allows
  let cw = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0
  let ch = cw / aspect

  if (maxCellW > 0 && cw > maxCellW) { cw = maxCellW; ch = cw / aspect }
  if (maxCellH > 0 && ch > maxCellH) { ch = maxCellH; cw = ch * aspect }

  const result = { ...fmt }
  result.TargetCellW_mm = fmt.TargetCellW_mm ?? fmt.CellW_mm ?? 0  // lock in target on first call
  result.CellW_mm = Math.round(cw * 100) / 100
  result.CellH_mm = Math.round(ch * 1000) / 1000
  // Margins are not touched — they remain as the user set them
  return result
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GridToolbar({ format, onChange, cellPresets = [] }) {
  const [gutterLinked, setGutterLinked] = useState(true)
  const [lastChangedGutter, setLastChangedGutter] = useState('x')
  const [marginLinkedH, setMarginLinkedH] = useState(true)  // Left ↔ Right
  const [marginLinkedV, setMarginLinkedV] = useState(true)  // Top ↔ Bottom
  const [lastChangedMarginH, setLastChangedMarginH] = useState('l')
  const [lastChangedMarginV, setLastChangedMarginV] = useState('t')

  const barPos    = parseBarPosition(format.DefaultBarPosition)
  const hasHeader = format.HeaderType && format.HeaderType !== 'NONE'
  const hasBar    = format.DefaultBarType && format.DefaultBarType !== 'NONE'

  // Cell height always derived from CellW / CellAspect
  const cellH = format.CellW_mm && format.CellAspect
    ? Math.round((format.CellW_mm / format.CellAspect) * 1000) / 1000
    : format.CellH_mm

  const canvasW = format.CanvasWidth_mm || 0

  // No hard max on cols/rows — cells shrink automatically to fit

  // ─── Preset matching ───────────────────────────────────────────────────────
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

  // Apply preset: restore preset cell size + gutter, recalculate max cols/rows that fit
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
      CellW_mm: cw,
      CellAspect: preset.CellAspect,
      CellH_mm: ch,
      TargetCellW_mm: cw,
      Cols: maxCols,
      Rows: maxRows,
      ...(preset.GutterX_mm != null && { GutterX_mm: preset.GutterX_mm }),
      ...(preset.GutterY_mm != null && { GutterY_mm: preset.GutterY_mm }),
    }
    onChange(withFittedAndCentered(updated))
  }

  // ─── Set helper ────────────────────────────────────────────────────────────
  function set(key, value) {
    onChange({ ...format, [key]: value })
  }

  function setBarPosType(type) {
    onChange({ ...format, DefaultBarPosition: serializeBarPosition(type, barPos.row) })
  }

  function setBarPosRow(row) {
    onChange({ ...format, DefaultBarPosition: serializeBarPosition('AFTER_ROW', row) })
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────
  function handleColsChange(newCols) {
    onChange(withFittedAndCentered({ ...format, Cols: Math.max(1, newCols) }))
  }

  function handleRowsChange(newRows) {
    onChange(withFittedAndCentered({ ...format, Rows: Math.max(1, newRows) }))
  }

  // ─── Cel ───────────────────────────────────────────────────────────────────
  function handleCellWChange(v) {
    const newH = Math.round(v / (format.CellAspect || 1.667) * 1000) / 1000
    onChange(withFittedAndCentered({ ...format, CellW_mm: v, CellH_mm: newH, TargetCellW_mm: v }))
  }

  // ─── Gutter ────────────────────────────────────────────────────────────────
  function handleGutterXChange(v) {
    setLastChangedGutter('x')
    const updated = gutterLinked
      ? { ...format, GutterX_mm: v, GutterY_mm: v }
      : { ...format, GutterX_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleGutterYChange(v) {
    setLastChangedGutter('y')
    const updated = gutterLinked
      ? { ...format, GutterY_mm: v, GutterX_mm: v }
      : { ...format, GutterY_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleGutterLinkToggle() {
    if (!gutterLinked) {
      const updated = lastChangedGutter === 'y'
        ? { ...format, GutterX_mm: format.GutterY_mm }
        : { ...format, GutterY_mm: format.GutterX_mm }
      onChange(withFittedAndCentered(updated))
    }
    setGutterLinked(v => !v)
  }

  // ─── Marges ────────────────────────────────────────────────────────────────
  function handleMarginLChange(v) {
    setLastChangedMarginH('l')
    const updated = marginLinkedH
      ? { ...format, MarginLeft_mm: v, MarginRight_mm: v }
      : { ...format, MarginLeft_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleMarginRChange(v) {
    setLastChangedMarginH('r')
    const updated = marginLinkedH
      ? { ...format, MarginRight_mm: v, MarginLeft_mm: v }
      : { ...format, MarginRight_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleMarginTChange(v) {
    setLastChangedMarginV('t')
    const updated = marginLinkedV
      ? { ...format, MarginTop_mm: v, MarginBottom_mm: v }
      : { ...format, MarginTop_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleMarginBChange(v) {
    setLastChangedMarginV('b')
    const updated = marginLinkedV
      ? { ...format, MarginBottom_mm: v, MarginTop_mm: v }
      : { ...format, MarginBottom_mm: v }
    onChange(withFittedAndCentered(updated))
  }

  function handleMarginLinkHToggle() {
    if (!marginLinkedH) {
      const updated = lastChangedMarginH === 'r'
        ? { ...format, MarginLeft_mm: format.MarginRight_mm }
        : { ...format, MarginRight_mm: format.MarginLeft_mm }
      onChange(withFittedAndCentered(updated))
    }
    setMarginLinkedH(v => !v)
  }

  function handleMarginLinkVToggle() {
    if (!marginLinkedV) {
      const updated = lastChangedMarginV === 'b'
        ? { ...format, MarginTop_mm: format.MarginBottom_mm }
        : { ...format, MarginBottom_mm: format.MarginTop_mm }
      onChange(withFittedAndCentered(updated))
    }
    setMarginLinkedV(v => !v)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto flex-shrink-0">
      <div className="flex items-end gap-3 min-w-max">

        {/* Grid + Preset */}
        <Group label="Grid">
          {cellPresets && cellPresets.length > 0 && (
            <label className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Preset</span>
              <select
                value={findMatchingPreset()}
                onChange={e => applyPreset(e.target.value)}
                className="text-xs px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[120px]"
              >
                <option value="">— Aangepast —</option>
                {cellPresets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          )}
          <IntInput label="Kolommen" value={format.Cols} min={1}
            onChange={handleColsChange} />
          <IntInput label="Rijen" value={format.Rows} min={1}
            onChange={handleRowsChange} />
        </Group>

        <Sep />

        {/* Cel */}
        <Group label="Cel">
          <NumInput label="Breedte" value={format.CellW_mm} step={0.1}
            onChange={handleCellWChange} />
          <NumInput label="Hoogte" value={cellH} unit="mm" readOnly />
        </Group>

        <Sep />

        {/* Gutter */}
        <Group label="Gutter">
          <NumInput label="Horiz" value={format.GutterX_mm} step={0.5}
            onChange={handleGutterXChange} />
          <LinkBtn
            linked={gutterLinked}
            onToggle={handleGutterLinkToggle}
            title={gutterLinked
              ? 'Horiz en Vert zijn gelinkt — klik om los te koppelen'
              : 'Horiz en Vert zijn los — klik om te linken'}
          />
          <NumInput label="Vert" value={format.GutterY_mm} step={0.5}
            onChange={handleGutterYChange} />
        </Group>

        <Sep />

        {/* Marges */}
        <Group label="Marges">
          <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} min={0} onChange={handleMarginLChange} />
          <LinkBtn
            linked={marginLinkedH}
            onToggle={handleMarginLinkHToggle}
            title={marginLinkedH ? 'Links en Rechts gelinkt — klik om los te koppelen' : 'Links en Rechts los — klik om te linken'}
          />
          <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} min={0} onChange={handleMarginRChange} />
          <Sep />
          <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} min={0} onChange={handleMarginTChange} />
          <LinkBtn
            linked={marginLinkedV}
            onToggle={handleMarginLinkVToggle}
            title={marginLinkedV ? 'Boven en Onder gelinkt — klik om los te koppelen' : 'Boven en Onder los — klik om te linken'}
          />
          <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} min={0} onChange={handleMarginBChange} />
        </Group>

        <Sep />

        {/* Header */}
        <Group label="Header">
          <SelectInput label="Type" value={format.HeaderType || 'NONE'} options={HEADER_OPTIONS}
            onChange={v => set('HeaderType', v)} />
          {hasHeader && <>
            <NumInput label="Hoogte" value={format.HeaderHeight_mm} step={1} onChange={v => set('HeaderHeight_mm', v)} />
            <NumInput label="Marge" value={format.HeaderMargin_mm} step={0.5} onChange={v => set('HeaderMargin_mm', v)} />
          </>}
        </Group>

        <Sep />

        {/* Divider */}
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

        {/* Stijl */}
        <Group label="Stijl">
          <label className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">Achtergrond</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={format.BackgroundColor_Hex || '#000000'}
                onChange={e => set('BackgroundColor_Hex', e.target.value)}
                className="w-8 h-7 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <span className="text-[10px] font-mono text-gray-500">
                {format.BackgroundColor_Hex || '#000000'}
              </span>
            </div>
          </label>
          <SelectInput label="Leeg slot" value={format.PlaceEmpty || 'blank'} options={PLACE_EMPTY_OPTIONS}
            onChange={v => set('PlaceEmpty', v)} />
        </Group>

      </div>
    </div>
  )
}
