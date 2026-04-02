import { useState, useMemo } from 'react'
import formats from '../data/backdropFormats.json'

const STATIC_CATEGORIES = ['Alle', ...[...new Set(formats.map(f => f.Categorie))].sort()]

function r(v, d = 1) {
  const m = Math.pow(10, d)
  return Math.round(v * m) / m
}

function defaultForm() {
  return {
    Code: '',
    Beschrijving: '',
    Categorie: 'CUSTOM',
    EventStyle: 'CUSTOM',
    Variant: null,
    Cols: 10,
    Rows: 6,
    CellW_mm: 356,
    CellAspect: 1.667,
    CellH_mm: r(356 / 1.667),
    GutterX_mm: 80,
    GutterY_mm: 80,
    MarginLeft_mm: 57.5,
    MarginTop_mm: 36.5,
    MarginRight_mm: 57.5,
    MarginBottom_mm: 36.5,
    CanvasWidth_mm: 7900,
    CanvasHeight_mm: 2300,
    ArtboardWidth_mm: 790,
    ArtboardHeight_mm: 230,
    Bleed_mm: 10,
    Scale: 0.1,
    PlaceEmpty: 'blank',
    FallbackSymbol: 'BLANK',
    HeaderType: 'NONE',
    DefaultBarType: 'NONE',
    DefaultBarPosition: 'NONE',
    BackgroundColor_Hex: '#050703',
    Notes: null,
  }
}

// ── Canvas thumbnail (canvas shape + grid lines) ──────────────────────────────
function FormatThumbnail({ format, maxW = 96, h = 52 }) {
  const cw = format.CanvasWidth_mm || 7900
  const ch = format.CanvasHeight_mm || 2300
  const aspect = cw / ch
  const thumbW = Math.min(Math.round(h * aspect), maxW)
  const cols = Math.min(format.Cols || 1, 24)
  const rows = Math.min(format.Rows || 1, 16)
  const bg = format.BackgroundColor_Hex || '#050703'
  return (
    <div className="relative rounded overflow-hidden mx-auto flex-shrink-0"
      style={{ width: thumbW, height: h, backgroundColor: bg }}>
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div key={'c'+i} className="absolute top-0 bottom-0"
          style={{ left: `${((i+1)/cols)*100}%`, width: 1, background: 'rgba(255,255,255,0.18)' }} />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div key={'r'+i} className="absolute left-0 right-0"
          style={{ top: `${((i+1)/rows)*100}%`, height: 1, background: 'rgba(255,255,255,0.18)' }} />
      ))}
    </div>
  )
}

// ── Blank / new card ─────────────────────────────────────────────────────────
function BlankCard({ onClick }) {
  return (
    <div onClick={onClick}
      className="p-2.5 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-1.5 select-none"
      style={{ minHeight: 92 }}>
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M7 2v10M2 7h10"/>
        </svg>
      </div>
      <p className="text-[10px] font-medium text-gray-400">Leeg formaat</p>
    </div>
  )
}

// ── Preset card (browse grid) ─────────────────────────────────────────────────
function PresetCard({ format, isSelected, onClick, onDelete }) {
  return (
    <div onClick={onClick}
      className={`relative p-2.5 rounded-xl border cursor-pointer transition-all group select-none ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <FormatThumbnail format={format} maxW={120} h={52} />
      <p className={`text-[10px] font-semibold mt-2 truncate leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
        {format.Code}
      </p>
      <p className="text-[9px] text-gray-400 mt-0.5">{format.Cols}×{format.Rows}</p>
      {format.CanvasWidth_mm
        ? <p className="text-[9px] text-gray-300">{format.CanvasWidth_mm}×{format.CanvasHeight_mm}</p>
        : null}
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(format) }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-300 hover:text-red-500 bg-white/90"
          title="Verwijderen">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Chain / link button ───────────────────────────────────────────────────────
function LinkBtn({ linked, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className={`flex-shrink-0 p-1 rounded transition-colors ${linked ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
      title={linked ? 'Gelinkt' : 'Los — klik om te linken'}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 9.5a3.536 3.536 0 0 0 5 0l2-2a3.536 3.536 0 0 0-5-5L7.25 3.75"/>
        <path d="M9.5 6.5a3.536 3.536 0 0 0-5 0l-2 2a3.536 3.536 0 0 0 5 5L8.75 12.25"/>
        {!linked && <line x1="13" y1="3" x2="3" y2="13" strokeWidth="1.4"/>}
      </svg>
    </button>
  )
}

// ── Labeled number input ──────────────────────────────────────────────────────
function NumField({ label, value, onChange, unit = 'mm', min, step = 1, wide = false }) {
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-[10px] text-gray-400 flex-shrink-0 text-right" style={{ width: 52 }}>{label}</span>}
      <input type="number" value={value} min={min} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className={`text-xs px-2 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${wide ? 'w-20' : 'w-16'}`}
      />
      {unit && <span className="text-[10px] text-gray-400 flex-shrink-0">{unit}</span>}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SLabel({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2 mt-5 first:mt-0 border-b border-gray-100 pb-1">
      {children}
    </p>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function FormatPickerModal({ customFormats = [], onConfirm, onSaveCustom, onDeleteCustom, onClose }) {
  // 'browse' = level 1 (preset grid), 'detail' = level 2 (form)
  const [level, setLevel] = useState('browse')
  const [activeCategory, setActiveCategory] = useState('Alle')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [editingCustomId, setEditingCustomId] = useState(null)
  const [form, setForm] = useState(defaultForm())
  const [canvasLinked, setCanvasLinked] = useState(false)
  const [gutterLinked, setGutterLinked] = useState(true)
  const [saveAsPreset, setSaveAsPreset] = useState(false)
  const [presetSaved, setPresetSaved] = useState(false)

  const allCategories = useMemo(() => [
    ...STATIC_CATEGORIES,
    ...(customFormats.length > 0 ? ['Opgeslagen'] : [])
  ], [customFormats.length])

  const visiblePresets = useMemo(() => {
    if (activeCategory === 'Opgeslagen') return customFormats
    if (activeCategory === 'Alle') return formats
    return formats.filter(f => f.Categorie === activeCategory)
  }, [activeCategory, customFormats])

  function openDetail(preset, isCustom = false) {
    setSelectedPreset(preset)
    setForm(preset ? { ...defaultForm(), ...preset } : defaultForm())
    setEditingCustomId(isCustom ? (preset.id || preset.Code) : null)
    setSaveAsPreset(isCustom)
    setLevel('detail')
  }

  function goBack() {
    setLevel('browse')
  }

  function update(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'CanvasWidth_mm' && canvasLinked && prev.CanvasWidth_mm)
        next.CanvasHeight_mm = r(value / prev.CanvasWidth_mm * prev.CanvasHeight_mm)
      if (field === 'CanvasHeight_mm' && canvasLinked && prev.CanvasHeight_mm)
        next.CanvasWidth_mm = r(value / prev.CanvasHeight_mm * prev.CanvasWidth_mm)
      if (field === 'GutterX_mm' && gutterLinked) next.GutterY_mm = value
      if (field === 'GutterY_mm' && gutterLinked) next.GutterX_mm = value
      if (field === 'CellW_mm') next.CellH_mm = r(value / (prev.CellAspect || 1.667))
      if (field === 'CellAspect' && value > 0) next.CellH_mm = r((prev.CellW_mm || 356) / value)
      return next
    })
  }

  function handleConfirm() {
    if (!form.Code.trim()) return
    const final = {
      ...form,
      Code: form.Code.trim().toUpperCase(),
      Beschrijving: form.Beschrijving.trim() || form.Code.trim().toUpperCase(),
    }
    if (saveAsPreset || editingCustomId) onSaveCustom(final, editingCustomId)
    onConfirm(final)
  }

  const isEditing = !!editingCustomId

  // Duplicate code check — only when code field is editable
  const codeEditable = !(selectedPreset && !selectedPreset._custom)
  const isDuplicateCode = useMemo(() => {
    if (!codeEditable || !form.Code.trim()) return false
    const code = form.Code.trim().toUpperCase()
    const staticCodes = formats.map(f => f.Code)
    const customCodes = customFormats
      .filter(f => (f.id || f.Code) !== (editingCustomId || ''))
      .map(f => f.Code)
    return staticCodes.includes(code) || customCodes.includes(code)
  }, [form.Code, codeEditable, customFormats, editingCustomId])

  const canConfirm = !!form.Code.trim() && !isDuplicateCode

  // ── Level 1: Browse presets ─────────────────────────────────────────────────
  if (level === 'browse') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
          style={{ maxWidth: 860, maxHeight: 'calc(100vh - 48px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Nieuw formaat</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l10 10M14 4L4 14"/>
              </svg>
            </button>
          </div>

          {/* Category tabs */}
          <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex flex-wrap gap-1.5">
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : cat === 'Opgeslagen'
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {cat === 'Opgeslagen' ? `Opgeslagen (${customFormats.length})` : cat}
              </button>
            ))}
          </div>

          {/* Preset grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {/* Blank card — always first */}
              <BlankCard onClick={() => openDetail(null)} />
              {visiblePresets.map(p => (
                <PresetCard key={p.id || p.Code} format={p}
                  isSelected={false}
                  onClick={() => openDetail(p, activeCategory === 'Opgeslagen')}
                  onDelete={activeCategory === 'Opgeslagen' ? () => onDeleteCustom(p) : undefined}
                />
              ))}
            </div>
            {activeCategory === 'Opgeslagen' && visiblePresets.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center mt-4">
                Nog geen opgeslagen formaten — maak een formaat aan en vink "Opslaan als preset" aan.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 flex-shrink-0 bg-white">
            <p className="text-xs text-gray-400">{visiblePresets.length} formaten</p>
            <button onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Annuleren
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Level 2: Detail form ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
        style={{ maxWidth: 620, maxHeight: 'calc(100vh - 48px)' }}>

        {/* Header with back button */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L6 8l4 5"/>
            </svg>
            Terug
          </button>
          <h2 className="text-sm font-semibold text-gray-700">
            {isEditing ? 'Formaat bewerken' : selectedPreset ? selectedPreset.Code : 'Leeg formaat'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>

        {/* Live preview strip */}
        <div className="px-6 py-4 bg-gray-950 flex items-center gap-5 flex-shrink-0">
          <FormatThumbnail format={form} maxW={140} h={64} />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Preview</p>
            <p className="text-sm font-mono font-semibold text-white leading-tight">
              {form.Code || <span className="text-gray-500 font-sans font-normal italic">geen code</span>}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{form.Cols} × {form.Rows} = {form.Cols * form.Rows} slots</p>
            <p className="text-[11px] text-gray-500">{form.CanvasWidth_mm} × {form.CanvasHeight_mm} mm</p>
          </div>
        </div>

        {/* Form — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Preset Details</p>

          {/* Identificatie */}
          <SLabel>Identificatie</SLabel>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 flex-shrink-0 text-right" style={{ width: 52 }}>Code</span>
              <div className="flex-1 min-w-0">
                <input value={form.Code}
                  onChange={e => update('Code', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="CUSTOM_10x6"
                  readOnly={!!(selectedPreset && !selectedPreset._custom)}
                  className={`w-full text-sm px-3 py-1.5 border rounded-lg focus:outline-none font-mono ${
                    selectedPreset && !selectedPreset._custom
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
                      : isDuplicateCode
                        ? 'border-red-300 bg-red-50 focus:ring-1 focus:ring-red-400 text-red-700'
                        : 'border-gray-200 focus:ring-1 focus:ring-blue-400'
                  }`}
                />
                {isDuplicateCode && (
                  <p className="text-[10px] text-red-500 mt-0.5 px-1">Code bestaat al — kies een unieke naam</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 flex-shrink-0 text-right" style={{ width: 52 }}>Naam</span>
              <input value={form.Beschrijving}
                onChange={e => update('Beschrijving', e.target.value)}
                placeholder="Backdrop mixed zone..."
                className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Canvas */}
          <SLabel>Canvas</SLabel>
          <div className="flex items-center gap-2 flex-wrap">
            <NumField label="Breedte" value={form.CanvasWidth_mm} onChange={v => update('CanvasWidth_mm', v)} min={100} step={10} wide />
            <LinkBtn linked={canvasLinked} onToggle={() => setCanvasLinked(v => !v)} />
            <NumField label="Hoogte" value={form.CanvasHeight_mm} onChange={v => update('CanvasHeight_mm', v)} min={100} step={10} wide />
          </div>

          {/* Grid */}
          <SLabel>Grid</SLabel>
          <div className="flex items-center gap-4 flex-wrap">
            <NumField label="Kolommen" value={form.Cols} onChange={v => update('Cols', Math.max(1, Math.round(v)))} min={1} unit="" wide />
            <span className="text-gray-300 text-sm">×</span>
            <NumField label="Rijen" value={form.Rows} onChange={v => update('Rows', Math.max(1, Math.round(v)))} min={1} unit="" wide />
            <span className="text-[10px] text-gray-400">{form.Cols * form.Rows} slots</span>
          </div>

          {/* Cel */}
          <SLabel>Cel</SLabel>
          <div className="space-y-1.5">
            <NumField label="Breedte" value={form.CellW_mm} onChange={v => update('CellW_mm', v)} min={1} step={0.5} wide />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 flex-shrink-0 text-right" style={{ width: 52 }}>Aspect</span>
              <input type="number" value={form.CellAspect} min={0.1} step={0.001}
                onChange={e => update('CellAspect', parseFloat(e.target.value) || 1)}
                className="w-20 text-xs px-2 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
              <span className="text-[10px] text-gray-400 ml-1">→ hoogte: {r(form.CellH_mm || form.CellW_mm / form.CellAspect)} mm</span>
            </div>
          </div>

          {/* Gutter */}
          <SLabel>Gutter</SLabel>
          <div className="flex items-center gap-2 flex-wrap">
            <NumField label="Horiz" value={form.GutterX_mm} onChange={v => update('GutterX_mm', v)} min={0} step={0.5} wide />
            <LinkBtn linked={gutterLinked} onToggle={() => setGutterLinked(v => !v)} />
            <NumField label="Vert" value={form.GutterY_mm} onChange={v => update('GutterY_mm', v)} min={0} step={0.5} wide />
          </div>

          {/* Marges */}
          <SLabel>Marges</SLabel>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <NumField label="Links" value={form.MarginLeft_mm} onChange={v => update('MarginLeft_mm', v)} min={0} step={0.5} wide />
            <NumField label="Rechts" value={form.MarginRight_mm} onChange={v => update('MarginRight_mm', v)} min={0} step={0.5} wide />
            <NumField label="Boven" value={form.MarginTop_mm} onChange={v => update('MarginTop_mm', v)} min={0} step={0.5} wide />
            <NumField label="Onder" value={form.MarginBottom_mm} onChange={v => update('MarginBottom_mm', v)} min={0} step={0.5} wide />
          </div>

          {/* Save as preset — alleen tonen als er geen startpunt is (leeg formaat) */}
          {!isEditing && !selectedPreset && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer mt-6 select-none">
              <input type="checkbox" checked={saveAsPreset} onChange={e => setSaveAsPreset(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-400"
              />
              Opslaan als herbruikbare preset
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 flex-shrink-0 bg-gray-50/80">
          <div className="flex items-center gap-3">
            {selectedPreset && selectedPreset._custom && (
              <button
                onClick={() => {
                  const final = {
                    ...form,
                    Code: form.Code.trim().toUpperCase(),
                    Beschrijving: form.Beschrijving.trim() || form.Code.trim().toUpperCase(),
                  }
                  onSaveCustom(final, editingCustomId || selectedPreset.id || selectedPreset.Code)
                  setPresetSaved(true)
                  setTimeout(() => setPresetSaved(false), 2500)
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Preset bijwerken
              </button>
            )}
            {presetSaved && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l3.5 3.5L11 3"/>
                </svg>
                Preset opgeslagen
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Annuleren
            </button>
            <button onClick={handleConfirm} disabled={!canConfirm}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                canConfirm
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {isEditing ? 'Bijwerken & gebruiken' : saveAsPreset ? 'Aanmaken & opslaan' : 'Aanmaken'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
