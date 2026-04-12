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
  const containerW = 480
  const containerH = Math.max(30, Math.round(containerW * H / W))
  const px = containerW / W

  const cellW = (form.CellW_mm || 0) * s * px
  const cellH = (form.CellH_mm || 0) * s * px
  const gutX  = (form.GutterX_mm || 0) * s * px
  const gutY  = (form.GutterY_mm || 0) * s * px
  const marL  = (form.MarginLeft_mm || 0) * s * px
  const marT  = (form.MarginTop_mm || 0) * s * px
  const bleed = (form.Bleed_mm || 0) * s * px
  const cols  = form.Cols || 0
  const rows  = form.Rows || 0
  const bg    = form.BackgroundColor_Hex || '#050703'

  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: marL + c * (cellW + gutX),
        y: marT + r * (cellH + gutY),
        w: cellW,
        h: cellH,
      })
    }
  }

  return (
    <div className="rounded-lg overflow-hidden bg-gray-100 p-2">
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
        {/* Artboard border */}
        <rect x={0} y={0} width={containerW} height={containerH}
          fill="none" stroke="white" strokeOpacity={0.15} strokeWidth={1} />
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1">
        {form.Cols}×{form.Rows} · {form.CanvasWidth_mm}×{form.CanvasHeight_mm} mm
      </p>
    </div>
  )
}

function autoCode(str) {
  return (str || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function LinkBtn({ linked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={linked ? 'Ontkoppelen' : 'Koppelen'}
      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border transition-colors ${
        linked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500'
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {linked
          ? <><path d="M4 6h4"/><path d="M3 4a2 2 0 010 4"/><path d="M9 4a2 2 0 010 4"/></>
          : <><path d="M4 6h1M7 6h1"/><path d="M3 4a2 2 0 010 4"/><path d="M9 4a2 2 0 010 4"/></>
        }
      </svg>
    </button>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  )
}

function NumField({ label, value, onChange, step = 1, min, unit, readOnly }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 truncate">
        {label}{unit && <span className="font-normal normal-case tracking-normal ml-0.5 text-gray-300">{unit}</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => !readOnly && onChange(parseFloat(e.target.value) || 0)}
        step={step}
        min={min}
        readOnly={readOnly}
        className={`w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          readOnly ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-gray-200'
        }`}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
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
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  )
}

export default function FormatEditModal({ format, allTags = [], onSave, onClose }) {
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
    Bleed_mm: 10,
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
  const [marginHLinked, setMarginHLinked] = useState(false)
  const [marginVLinked, setMarginVLinked] = useState(false)
  const [canvasLinked, setCanvasLinked] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestOpen, setTagSuggestOpen] = useState(false)
  const [codeManual, setCodeManual] = useState(!isNew)

  function set(key, value) {
    setForm(f => {
      const next = { ...f, [key]: value }
      if (key === 'CellW_mm' || key === 'CellAspect') {
        const w = key === 'CellW_mm' ? value : f.CellW_mm
        const a = key === 'CellAspect' ? value : f.CellAspect
        next.CellH_mm = a > 0 ? Math.round((w / a) * 1000) / 1000 : 0
      }
      if (key === 'Scale') {
        next.ArtboardWidth_mm = Math.round(f.CanvasWidth_mm * value)
        next.ArtboardHeight_mm = Math.round(f.CanvasHeight_mm * value)
      }
      if (key === 'CanvasWidth_mm') {
        next.ArtboardWidth_mm = Math.round(value * f.Scale)
        if (canvasLinked && f.CanvasHeight_mm) {
          const ratio = f.CanvasWidth_mm / f.CanvasHeight_mm
          next.CanvasHeight_mm = Math.round(value / ratio)
          next.ArtboardHeight_mm = Math.round(next.CanvasHeight_mm * f.Scale)
        }
      }
      if (key === 'CanvasHeight_mm') {
        next.ArtboardHeight_mm = Math.round(value * f.Scale)
        if (canvasLinked && f.CanvasWidth_mm) {
          const ratio = f.CanvasWidth_mm / f.CanvasHeight_mm
          next.CanvasWidth_mm = Math.round(value * ratio)
          next.ArtboardWidth_mm = Math.round(next.CanvasWidth_mm * f.Scale)
        }
      }
      if (key === 'GutterX_mm' && gutterLinked) next.GutterY_mm = value
      if (key === 'GutterY_mm' && gutterLinked) next.GutterX_mm = value
      if (key === 'MarginLeft_mm' && marginHLinked) next.MarginRight_mm = value
      if (key === 'MarginRight_mm' && marginHLinked) next.MarginLeft_mm = value
      if (key === 'MarginTop_mm' && marginVLinked) next.MarginBottom_mm = value
      if (key === 'MarginBottom_mm' && marginVLinked) next.MarginTop_mm = value
      if (key === 'Beschrijving' && !codeManual) {
        next.Code = autoCode(value)
      }
      return next
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}
        onMouseDown={e => e.stopPropagation()}>

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
        <div className="overflow-y-auto flex-1">

          {/* Naam & Tags */}
          <Section title="Naam & Tags" defaultOpen={true}>
            <div className="space-y-4">
              <TextField
                label="Naam"
                value={form.Beschrijving}
                onChange={v => set('Beschrijving', v)}
                placeholder="Bv. Backdrop Flash interview"
              />
              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tags</label>
                <div className="flex flex-wrap gap-1.5 min-h-8">
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
                      placeholder="Nieuw tag (Enter om toe te voegen)"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button type="button" onClick={() => { addTag(); setTagSuggestOpen(false) }}
                      className="px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-lg hover:bg-gray-900 transition-colors">
                      +
                    </button>
                  </div>
                  {/* Autocomplete suggestions */}
                  {tagSuggestOpen && (() => {
                    const q = tagInput.trim().toLowerCase()
                    const suggestions = allTags.filter(t =>
                      !form.tags.includes(t) && (q === '' || t.includes(q))
                    ).slice(0, 8)
                    return suggestions.length > 0 ? (
                      <div className="absolute z-10 top-full left-0 right-8 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {suggestions.map(t => (
                          <button
                            key={t}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); set('tags', [...form.tags, t]); setTagInput(''); setTagSuggestOpen(false) }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : null
                  })()}
                </div>
              </div>
            </div>
          </Section>

          {/* Canvas */}
          <Section title="Canvas" defaultOpen={true}>
            <div className="space-y-3">

              {/* Afmetingen */}
              <div className="flex items-end gap-2">
                <NumField label="Breedte" value={form.CanvasWidth_mm} onChange={v => set('CanvasWidth_mm', v)} step={10} unit="mm" />
                <LinkBtn linked={canvasLinked} onToggle={() => setCanvasLinked(v => !v)} />
                <NumField label="Hoogte" value={form.CanvasHeight_mm} onChange={v => set('CanvasHeight_mm', v)} step={10} unit="mm" />
              </div>

              {/* Schaal + Bleed */}
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Schaal" value={form.Scale} onChange={v => set('Scale', v)} step={0.01} min={0.01} />
                <NumField label="Bleed" value={form.Bleed_mm} onChange={v => set('Bleed_mm', v)} step={1} unit="mm" />
              </div>

              {/* Achtergrond */}
              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Achtergrond</label>
                  <button
                    type="button"
                    onClick={() => set('BackgroundColor_Cmyk', hexToCmyk(form.BackgroundColor_Hex))}
                    className="text-[10px] text-blue-500 hover:text-blue-700 underline"
                  >
                    CMYK berekenen van HEX
                  </button>
                </div>
                {/* HEX */}
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">HEX <span className="font-normal text-gray-300">(online weergave)</span></p>
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
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono bg-white"
                    />
                  </div>
                </div>
                {/* CMYK */}
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">CMYK <span className="font-normal text-gray-300">(export / druk)</span></p>
                  <div className="grid grid-cols-4 gap-2">
                    {['c', 'm', 'y', 'k'].map(ch => (
                      <div key={ch} className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{ch}</label>
                        <input
                          type="number"
                          min={0} max={100} step={1}
                          value={form.BackgroundColor_Cmyk?.[ch] ?? 0}
                          onChange={e => set('BackgroundColor_Cmyk', {
                            ...form.BackgroundColor_Cmyk,
                            [ch]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                          })}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Artboard (readonly) */}
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Artboard breedte" value={form.ArtboardWidth_mm} onChange={() => {}} step={10} unit="mm" readOnly />
                <NumField label="Artboard hoogte" value={form.ArtboardHeight_mm} onChange={() => {}} step={10} unit="mm" readOnly />
              </div>
              <p className="text-[10px] text-gray-300">Artboard-afmetingen worden automatisch berekend (Canvas × Schaal).</p>
            </div>
          </Section>

          {/* Grid */}
          <Section title="Grid" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Kolommen" value={form.Cols} onChange={v => set('Cols', Math.max(1, Math.round(v)))} step={1} min={1} />
              <NumField label="Rijen" value={form.Rows} onChange={v => set('Rows', Math.max(1, Math.round(v)))} step={1} min={1} />
            </div>
          </Section>

          {/* Cel */}
          <Section title="Cel" defaultOpen={true}>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Breedte" value={form.CellW_mm} onChange={v => set('CellW_mm', v)} step={1} unit="mm" />
              <NumField label="Verhouding (B/H)" value={form.CellAspect} onChange={v => set('CellAspect', v)} step={0.001} />
              <NumField label="Hoogte" value={form.CellH_mm} onChange={() => {}} unit="mm" readOnly />
            </div>
            <p className="text-[10px] text-gray-300 mt-2">Hoogte wordt automatisch berekend (Breedte ÷ Verhouding).</p>
          </Section>

          {/* Gutter */}
          <Section title="Gutter" defaultOpen={true}>
            <div className="flex items-end gap-2">
              <NumField label="Horizontaal (X)" value={form.GutterX_mm} onChange={v => set('GutterX_mm', v)} step={1} unit="mm" />
              <LinkBtn linked={gutterLinked} onToggle={() => setGutterLinked(v => !v)} />
              <NumField label="Verticaal (Y)" value={form.GutterY_mm} onChange={v => set('GutterY_mm', v)} step={1} unit="mm" />
            </div>
          </Section>

          {/* Marges */}
          <Section title="Marges" defaultOpen={true}>
            <div className="space-y-3">
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
            </div>
          </Section>

          {/* Header */}
          <Section title="Header" defaultOpen={false}>
            <div className="space-y-3">
              <SelectField
                label="Type"
                value={form.HeaderType}
                onChange={v => set('HeaderType', v)}
                options={['NONE', 'BAR', 'LOGO', 'CUSTOM']}
              />
              {form.HeaderType !== 'NONE' && (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Hoogte" value={form.HeaderHeight_mm} onChange={v => set('HeaderHeight_mm', v)} step={1} unit="mm" />
                  <NumField label="Marge" value={form.HeaderMargin_mm} onChange={v => set('HeaderMargin_mm', v)} step={1} unit="mm" />
                </div>
              )}
            </div>
          </Section>

          {/* Divider bar */}
          <Section title="Divider bar" defaultOpen={false}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-3 gap-3">
                  <NumField label="Hoogte" value={form.DefaultBarHeight_mm} onChange={v => set('DefaultBarHeight_mm', v)} step={1} unit="mm" />
                  <NumField label="Gap boven" value={form.DefaultBarGapTop_mm} onChange={v => set('DefaultBarGapTop_mm', v)} step={1} unit="mm" />
                  <NumField label="Gap onder" value={form.DefaultBarGapBottom_mm} onChange={v => set('DefaultBarGapBottom_mm', v)} step={1} unit="mm" />
                </div>
              )}
            </div>
          </Section>

          {/* Illustrator */}
          <Section title="Illustrator & Metadata" defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Code
                  {!codeManual && <span className="ml-1 font-normal normal-case text-gray-300">(automatisch)</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.Code ?? ''}
                    onChange={e => { setCodeManual(true); set('Code', e.target.value.toUpperCase()) }}
                    placeholder={autoCode(form.Beschrijving || '')}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                  />
                  {codeManual && (
                    <button type="button"
                      onClick={() => { setCodeManual(false); set('Code', autoCode(form.Beschrijving || '')) }}
                      className="text-xs px-2 py-1 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg">
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <TextField label="Categorie" value={form.Categorie} onChange={v => set('Categorie', v)} />
                <TextField label="Event style" value={form.EventStyle} onChange={v => set('EventStyle', v)} />
                <TextField label="Variant" value={form.Variant} onChange={v => set('Variant', v)} placeholder="Bv. WIDE" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Artboard naampatroon" value={form.ArtboardNamePattern} onChange={v => set('ArtboardNamePattern', v)} />
                <TextField label="Laag prefix" value={form.LayerPrefix} onChange={v => set('LayerPrefix', v)} />
              </div>
            </div>
          </Section>

          {/* Notities */}
          <Section title="Notities" defaultOpen={false}>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Notities</label>
              <textarea
                value={form.Notes ?? ''}
                onChange={e => set('Notes', e.target.value)}
                rows={3}
                placeholder="Interne notities over dit formaat..."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {isNew ? 'Aanmaken' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
