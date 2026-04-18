import { useState, useEffect } from 'react'
import {
  loadCellPresets, saveCellPresets,
  loadCanvasPresets, saveCanvasPresets,
  loadBackgroundPresets, upsertBackgroundPreset, deleteBackgroundPreset,
  loadSetting, saveSetting,
  loadKoepels, loadEvents,
} from '../../utils/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexToCmykApprox(hex) {
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

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Numeriek invoerveld ──────────────────────────────────────────────────────

function NumInput({ label, value, onChange, step = 1, unit = 'mm' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          step={step}
          className="flex-1 px-3 py-2 text-sm outline-none min-w-0"
          style={{ width: 80 }}
        />
        <span className="text-xs text-gray-400 px-2 bg-gray-50 border-l border-gray-200 py-2">{unit}</span>
      </div>
    </div>
  )
}

// ─── Cel presets ──────────────────────────────────────────────────────────────

const ASPECT_SHORTCUTS = [
  { label: '5:3', val: 1.667 },
  { label: '16:9', val: 1.778 },
  { label: '3:2', val: 1.5 },
  { label: '4:3', val: 1.333 },
]

function CelTab({ showToast }) {
  const [presets, setPresets] = useState([])
  const [editing, setEditing] = useState(null) // preset object of null
  const [loading, setLoading] = useState(true)
  const [defaultAspect, setDefaultAspect] = useState(1.667)
  const [aspectDraft, setAspectDraft] = useState('1.667')

  useEffect(() => {
    Promise.all([
      loadCellPresets(),
      loadSetting('default_aspect', 1.667),
    ]).then(([p, aspect]) => {
      setPresets(p)
      setDefaultAspect(aspect)
      setAspectDraft(String(aspect))
      setLoading(false)
    }).catch(e => { showToast('Laden mislukt', 'error'); setLoading(false) })
  }, [])

  async function saveAspect(val) {
    const v = Math.max(0.1, parseFloat(val) || 1.667)
    setDefaultAspect(v)
    setAspectDraft(String(v))
    try { await saveSetting('default_aspect', v); showToast('Aspect ratio opgeslagen') }
    catch (e) { showToast('Opslaan mislukt', 'error') }
  }

  function startNew() {
    setEditing({ id: genId(), name: '', CellW_mm: 200, CellAspect: 2, GutterX_mm: 10, GutterY_mm: 10 })
  }

  function handleEdit(p) { setEditing({ ...p }) }

  async function handleSave() {
    if (!editing.name.trim()) return
    const next = presets.some(p => p.id === editing.id)
      ? presets.map(p => p.id === editing.id ? editing : p)
      : [...presets, editing]
    setPresets(next)
    setEditing(null)
    try { await saveCellPresets(next); showToast('Preset opgeslagen') }
    catch (e) { showToast('Opslaan mislukt: ' + e.message, 'error') }
  }

  async function handleDelete(id) {
    const next = presets.filter(p => p.id !== id)
    setPresets(next)
    try { await saveCellPresets(next); showToast('Preset verwijderd') }
    catch (e) { showToast('Verwijderen mislukt', 'error') }
  }

  if (loading) return <div className="text-sm text-gray-400 py-4">Laden…</div>

  return (
    <div>

      {/* ── Standaard aspect ratio ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-1">Standaard aspect ratio</p>
        <p className="text-xs text-blue-400 mb-3">Verhouding breedte ÷ hoogte voor nieuwe en aangepaste cellen.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={aspectDraft}
              step={0.001}
              min={0.1}
              onChange={e => setAspectDraft(e.target.value)}
              onBlur={() => saveAspect(aspectDraft)}
              className="w-24 text-sm px-2 py-1.5 border border-blue-200 rounded-lg text-right tabular-nums font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
            <span className="text-xs text-blue-400">= {Math.round(defaultAspect * 100)}:100</span>
          </div>
          <div className="flex gap-1.5">
            {ASPECT_SHORTCUTS.map(({ label, val }) => (
              <button
                key={label}
                onClick={() => saveAspect(val)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  Math.abs(defaultAspect - val) < 0.002
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-blue-200 text-blue-500 hover:border-blue-400 hover:bg-blue-100'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cel presets ── */}
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Cel presets</p>
      <div className="space-y-2 mb-4">
        {presets.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-400">
                {p.CellW_mm}mm · 1:{p.CellAspect} · gutter {p.GutterX_mm}/{p.GutterY_mm}mm
              </p>
            </div>
            <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {presets.length === 0 && <p className="text-xs text-gray-400 italic">Nog geen presets</p>}
      </div>
      <button onClick={startNew}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nieuwe preset
      </button>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Cel preset</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Naam</label>
                <input
                  value={editing.name}
                  onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                  placeholder="Bijv. Backstage 200mm"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Breedte" value={editing.CellW_mm}
                  onChange={v => setEditing(p => ({ ...p, CellW_mm: v }))} />
                <NumInput label="Verhouding (1:x)" value={editing.CellAspect}
                  onChange={v => setEditing(p => ({ ...p, CellAspect: v }))} step={0.1} unit="×" />
                <NumInput label="Gutter H" value={editing.GutterX_mm}
                  onChange={v => setEditing(p => ({ ...p, GutterX_mm: v }))} />
                <NumInput label="Gutter V" value={editing.GutterY_mm}
                  onChange={v => setEditing(p => ({ ...p, GutterY_mm: v }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={handleSave} disabled={!editing.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Canvas presets ───────────────────────────────────────────────────────────

function CanvasTab({ showToast }) {
  const [presets, setPresets] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCanvasPresets().then(p => { setPresets(p); setLoading(false) })
      .catch(() => { showToast('Laden mislukt', 'error'); setLoading(false) })
  }, [])

  function startNew() {
    setEditing({ id: genId(), name: '', CanvasWidth_mm: 8000, CanvasHeight_mm: 3000 })
  }

  async function handleSave() {
    if (!editing.name.trim()) return
    const next = presets.some(p => p.id === editing.id)
      ? presets.map(p => p.id === editing.id ? editing : p)
      : [...presets, editing]
    setPresets(next)
    setEditing(null)
    try { await saveCanvasPresets(next); showToast('Preset opgeslagen') }
    catch (e) { showToast('Opslaan mislukt: ' + e.message, 'error') }
  }

  async function handleDelete(id) {
    const next = presets.filter(p => p.id !== id)
    setPresets(next)
    try { await saveCanvasPresets(next); showToast('Preset verwijderd') }
    catch (e) { showToast('Verwijderen mislukt', 'error') }
  }

  if (loading) return <div className="text-sm text-gray-400 py-4">Laden…</div>

  return (
    <div>
      <div className="space-y-2 mb-4">
        {presets.map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-400">{p.CanvasWidth_mm} × {p.CanvasHeight_mm} mm</p>
            </div>
            <button onClick={() => setEditing({ ...p })} className="text-gray-400 hover:text-blue-600 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {presets.length === 0 && <p className="text-xs text-gray-400 italic">Nog geen presets</p>}
      </div>
      <button onClick={startNew}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nieuwe preset
      </button>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Canvas preset</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Naam</label>
                <input
                  value={editing.name}
                  onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                  placeholder="Bijv. Backstage 8×3m"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Breedte" value={editing.CanvasWidth_mm}
                  onChange={v => setEditing(p => ({ ...p, CanvasWidth_mm: v }))} step={100} />
                <NumInput label="Hoogte" value={editing.CanvasHeight_mm}
                  onChange={v => setEditing(p => ({ ...p, CanvasHeight_mm: v }))} step={100} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={handleSave} disabled={!editing.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Achtergrond presets ──────────────────────────────────────────────────────

function AchtergrondTab({ showToast }) {
  const [presets, setPresets] = useState([])
  const [koepels, setKoepels] = useState([])
  const [events, setEvents] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadBackgroundPresets(), loadKoepels(), loadEvents()])
      .then(([p, k, e]) => { setPresets(p); setKoepels(k); setEvents(e); setLoading(false) })
      .catch(e => { showToast('Laden mislukt: ' + e.message, 'error'); setLoading(false) })
  }, [])

  function startNew() {
    setEditing({
      id: crypto.randomUUID(),
      name: '',
      BackgroundColor_Hex: '#050703',
      BackgroundColor_Cmyk: { c: 0, m: 0, y: 0, k: 97 },
      koepelIds: [],
      eventCodes: [],
    })
  }

  function handleEdit(p) {
    setEditing({ ...p, BackgroundColor_Cmyk: { ...p.BackgroundColor_Cmyk } })
  }

  async function handleSave() {
    if (!editing.name.trim()) return
    const isNew = !presets.find(p => p.id === editing.id)
    const sortOrder = isNew ? presets.length : presets.findIndex(p => p.id === editing.id)
    try {
      await upsertBackgroundPreset(editing, sortOrder)
      setPresets(prev => isNew ? [...prev, editing] : prev.map(p => p.id === editing.id ? editing : p))
      setEditing(null)
      showToast('Preset opgeslagen')
    } catch (e) {
      showToast('Opslaan mislukt: ' + e.message, 'error')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteBackgroundPreset(id)
      setPresets(prev => prev.filter(p => p.id !== id))
      showToast('Preset verwijderd', 'info')
    } catch (e) {
      showToast('Verwijderen mislukt: ' + e.message, 'error')
    }
  }

  function setCmyk(ch, val) {
    setEditing(e => ({
      ...e,
      BackgroundColor_Cmyk: { ...e.BackgroundColor_Cmyk, [ch]: Math.min(100, Math.max(0, parseInt(val) || 0)) }
    }))
  }

  function toggleKoepel(id) {
    const koepel = koepels.find(k => k.id === id)
    setEditing(e => {
      const alreadySelected = e.koepelIds.includes(id)
      return {
        ...e,
        koepelIds: alreadySelected ? [] : [id],
        eventCodes: alreadySelected ? e.eventCodes : [],
        name: alreadySelected ? e.name : (koepel ? koepel.name : e.name),
      }
    })
  }

  function toggleEvent(code) {
    setEditing(e => {
      const alreadySelected = e.eventCodes.includes(code)
      return {
        ...e,
        eventCodes: alreadySelected ? [] : [code],
        koepelIds: alreadySelected ? e.koepelIds : [],
        name: alreadySelected ? e.name : code,
      }
    })
  }

  if (loading) return <div className="text-sm text-gray-400 py-4">Laden…</div>

  return (
    <div>
      <div className="space-y-2 mb-4">
        {presets.map(p => {
          const linkedKoepels = koepels.filter(k => p.koepelIds.includes(k.id)).map(k => k.name)
          return (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 border border-gray-200 shadow-sm"
                style={{ backgroundColor: p.BackgroundColor_Hex }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono">
                  {p.BackgroundColor_Hex} · C{p.BackgroundColor_Cmyk.c} M{p.BackgroundColor_Cmyk.m} Y{p.BackgroundColor_Cmyk.y} K{p.BackgroundColor_Cmyk.k}
                </p>
                {(linkedKoepels.length > 0 || p.eventCodes.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {linkedKoepels.map(n => (
                      <span key={n} className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{n}</span>
                    ))}
                    {p.eventCodes.map(c => (
                      <span key={c} className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
        {presets.length === 0 && <p className="text-xs text-gray-400 italic">Nog geen presets</p>}
      </div>

      <button onClick={startNew}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nieuwe preset
      </button>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 48px)' }}>
            <h3 className="font-semibold text-gray-900 mb-4">Achtergrond preset</h3>
            <div className="space-y-4">

              {/* Naam */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Naam</label>
                <input
                  value={editing.name}
                  onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                  placeholder="Bijv. Ronde van Vlaanderen"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Kleur */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Kleur</label>
                  <button
                    type="button"
                    onClick={() => setEditing(p => ({ ...p, BackgroundColor_Cmyk: hexToCmykApprox(p.BackgroundColor_Hex) }))}
                    className="text-[11px] text-blue-500 hover:text-blue-700 underline"
                  >CMYK van HEX</button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="color"
                    value={editing.BackgroundColor_Hex}
                    onChange={e => setEditing(p => ({ ...p, BackgroundColor_Hex: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={editing.BackgroundColor_Hex}
                    onChange={e => setEditing(p => ({ ...p, BackgroundColor_Hex: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mb-1.5">CMYK <span className="text-gray-300">(druk)</span></p>
                <div className="grid grid-cols-4 gap-2">
                  {['c', 'm', 'y', 'k'].map(ch => (
                    <div key={ch}>
                      <label className="block text-[10px] text-center font-semibold uppercase text-gray-400 mb-1">{ch}</label>
                      <input
                        type="number" min={0} max={100} step={1}
                        value={editing.BackgroundColor_Cmyk[ch]}
                        onChange={e => setCmyk(ch, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Koepels */}
              {koepels.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Koepels</label>
                  <div className="space-y-1.5">
                    {koepels.map(k => (
                      <label key={k.id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="bg-preset-link"
                          checked={editing.koepelIds.includes(k.id)}
                          onChange={() => toggleKoepel(k.id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{k.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Individuele events */}
              {events.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Individuele events</label>
                  <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {events.map(code => (
                      <label key={code} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="bg-preset-link"
                          checked={editing.eventCodes.includes(code)}
                          onChange={() => toggleEvent(code)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-xs text-gray-600">{code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={handleSave} disabled={!editing.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'cel', label: 'Cel' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'achtergrond', label: 'Achtergrond' },
]

export default function PresetsSection({ showToast }) {
  const [activeTab, setActiveTab] = useState('cel')

  return (
    <div className="p-8 max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cel' && <CelTab showToast={showToast} />}
      {activeTab === 'canvas' && <CanvasTab showToast={showToast} />}
      {activeTab === 'achtergrond' && <AchtergrondTab showToast={showToast} />}
    </div>
  )
}
