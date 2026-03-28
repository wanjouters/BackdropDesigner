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
        onChange={e => onChange(parseInt(e.target.value) || min)}
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

export default function GridToolbar({ format, onChange }) {
  const barPos = parseBarPosition(format.DefaultBarPosition)
  const hasHeader = format.HeaderType && format.HeaderType !== 'NONE'
  const hasBar = format.DefaultBarType && format.DefaultBarType !== 'NONE'
  const cellH = format.CellW_mm && format.CellAspect
    ? Math.round((format.CellW_mm / format.CellAspect) * 1000) / 1000
    : format.CellH_mm

  function set(key, value) {
    onChange({ ...format, [key]: value })
  }

  function setBarPosType(type) {
    onChange({ ...format, DefaultBarPosition: serializeBarPosition(type, barPos.row) })
  }

  function setBarPosRow(row) {
    onChange({ ...format, DefaultBarPosition: serializeBarPosition('AFTER_ROW', row) })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto flex-shrink-0">
      <div className="flex items-end gap-3 min-w-max">

        {/* Grid */}
        <Group label="Grid">
          <IntInput label="Kolommen" value={format.Cols} min={1} max={30} onChange={v => set('Cols', v)} />
          <IntInput label="Rijen" value={format.Rows} min={1} max={30} onChange={v => set('Rows', v)} />
        </Group>

        <Sep />

        {/* Cel */}
        <Group label="Cel">
          <NumInput label="Breedte" value={format.CellW_mm} step={0.1}
            onChange={v => onChange({ ...format, CellW_mm: v, CellH_mm: Math.round(v / (format.CellAspect || 1.667) * 1000) / 1000 })} />
          <NumInput label="Aspect" value={format.CellAspect} unit="" step={0.001}
            onChange={v => onChange({ ...format, CellAspect: v, CellH_mm: Math.round((format.CellW_mm || 0) / v * 1000) / 1000 })} />
          <NumInput label="Hoogte" value={cellH} unit="mm" readOnly />
        </Group>

        <Sep />

        {/* Gutter */}
        <Group label="Gutter">
          <NumInput label="Horiz" value={format.GutterX_mm} step={0.5} onChange={v => set('GutterX_mm', v)} />
          <NumInput label="Vert" value={format.GutterY_mm} step={0.5} onChange={v => set('GutterY_mm', v)} />
        </Group>

        <Sep />

        {/* Marges */}
        <Group label="Marges">
          <NumInput label="Links" value={format.MarginLeft_mm} step={0.5} onChange={v => set('MarginLeft_mm', v)} />
          <NumInput label="Boven" value={format.MarginTop_mm} step={0.5} onChange={v => set('MarginTop_mm', v)} />
          <NumInput label="Rechts" value={format.MarginRight_mm} step={0.5} onChange={v => set('MarginRight_mm', v)} />
          <NumInput label="Onder" value={format.MarginBottom_mm} step={0.5} onChange={v => set('MarginBottom_mm', v)} />
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

        {/* Canvas */}
        <Group label="Canvas">
          <NumInput label="Breedte" value={format.CanvasWidth_mm} step={10} onChange={v => set('CanvasWidth_mm', v)} />
          <NumInput label="Hoogte" value={format.CanvasHeight_mm} step={10} onChange={v => set('CanvasHeight_mm', v)} />
          <NumInput label="Bleed" value={format.Bleed_mm} step={1} onChange={v => set('Bleed_mm', v)} />
          <NumInput label="Schaal" value={format.Scale} unit="×" step={0.1}
            onChange={v => set('Scale', v)} />
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
