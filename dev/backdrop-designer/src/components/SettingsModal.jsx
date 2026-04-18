import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalVariants, backdropVariants } from '../utils/animations'

const TABS = ['Celdimensies', 'Canvas', 'Events & Koepels', 'Categorieën']

// ─── ManageList (shared UI component) ────────────────────────────────────────
function ManageList({ title, color, items, onRename, onDelete, onAdd, onReorder, defaultCollapsed = false }) {
  const [newVal, setNewVal] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const renameRef = useRef(null)

  const colors = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', title: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', btn: 'text-orange-400 hover:text-orange-600', del: 'text-orange-300 hover:text-blue-500', input: 'border-orange-200 focus:ring-blue-300', add: 'bg-orange-500 hover:bg-orange-600', over: 'border-orange-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', title: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', btn: 'text-purple-400 hover:text-purple-600', del: 'text-purple-300 hover:text-red-500', input: 'border-purple-200 focus:ring-purple-400', add: 'bg-purple-500 hover:bg-purple-600', over: 'border-purple-400' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', title: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800', btn: 'text-indigo-400 hover:text-indigo-600', del: 'text-indigo-300 hover:text-red-500', input: 'border-indigo-200 focus:ring-indigo-400', add: 'bg-indigo-500 hover:bg-indigo-600', over: 'border-indigo-400' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-100', title: 'text-teal-700', badge: 'bg-teal-100 text-teal-800', btn: 'text-teal-400 hover:text-teal-600', del: 'text-teal-300 hover:text-blue-500', input: 'border-teal-200 focus:ring-blue-300', add: 'bg-teal-500 hover:bg-teal-600', over: 'border-teal-400' },
  }
  const c = colors[color]

  function doAdd() {
    const val = newVal.trim()
    if (!val || items.includes(val)) return
    onAdd(val)
    setNewVal('')
  }

  function handleDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const a = [...items]
    const [item] = a.splice(dragIdx, 1)
    a.splice(i, 0, item)
    onReorder(a)
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} mb-4`}>
      <button
        onClick={() => setCollapsed(v => !v)}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide ${c.title}`}
      >
        <span>{title} <span className="font-normal opacity-50">({items.length})</span></span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {!collapsed && (
        <div className="px-4 pb-3">
          <div className="space-y-1 mb-2">
            {items.map((item, i) => (
              <div key={item}
                onDragOver={onReorder ? e => { e.preventDefault(); setOverIdx(i) } : undefined}
                onDrop={onReorder ? () => handleDrop(i) : undefined}
                onDragLeave={onReorder ? () => setOverIdx(null) : undefined}
                className={`flex items-center gap-1.5 rounded transition-all ${overIdx === i && dragIdx !== i ? `border-2 ${c.over} bg-white` : ''}`}
              >
                {renaming?.old === item ? (
                  <>
                    <input ref={renameRef} autoFocus defaultValue={item}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { onRename(item, renameRef.current.value); setRenaming(null) }
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      className="flex-1 text-xs px-2 py-0.5 border border-blue-300 rounded focus:outline-none"
                    />
                    <button onMouseDown={e => { e.preventDefault(); onRename(item, renameRef.current.value); setRenaming(null) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
                    <button onMouseDown={() => setRenaming(null)} className="text-[10px] text-gray-400">✕</button>
                  </>
                ) : (
                  <>
                    {onReorder && (
                      <div draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 px-0.5 flex-shrink-0"
                      >
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                          <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                          <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
                          <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
                        </svg>
                      </div>
                    )}
                    <span className={`flex-1 text-xs font-semibold px-2 py-0.5 rounded ${c.badge} ${dragIdx === i ? 'opacity-40' : ''}`}>
                      {onReorder && <span className="opacity-40 mr-1">{i+1}.</span>}{item}
                    </span>
                    <button onClick={() => setRenaming({ old: item })} title="Hernoemen" className={c.btn}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
                    </button>
                    <button onClick={() => onDelete(item)} title="Verwijderen" className={c.del}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doAdd()} placeholder="Nieuw..."
              className={`flex-1 text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 bg-white ${c.input}`}
            />
            <button onClick={doAdd} className={`text-xs px-2 py-1 text-white rounded font-semibold transition-colors ${c.add}`}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Link toggle button — chain icon (shared with GridToolbar style)
function PresetLinkBtn({ linked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={linked ? 'Horiz en Vert gelinkt — klik om los te koppelen' : 'Horiz en Vert los — klik om te linken'}
      className={`self-center p-0.5 rounded transition-colors ${
        linked ? 'text-blue-500 hover:bg-blue-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
      }`}
    >
      {linked ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
          <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      )}
    </button>
  )
}

// ─── Tab: Celdimensies ────────────────────────────────────────────────────────
function CelDimensiesTab({ cellPresets, onCellPresetsChange, defaultAspect, onDefaultAspectChange }) {
  const [linkedPresets, setLinkedPresets] = useState(() => new Set(cellPresets.map(p => p.id)))

  function toggleLink(id) {
    setLinkedPresets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updatePreset(id, field, value) {
    const linked = linkedPresets.has(id)
    const next = cellPresets.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value }
      if (linked) {
        if (field === 'GutterX_mm') updated.GutterY_mm = value
        if (field === 'GutterY_mm') updated.GutterX_mm = value
      }
      return updated
    })
    onCellPresetsChange(next)
  }

  function deletePreset(id) {
    onCellPresetsChange(cellPresets.filter(p => p.id !== id))
  }

  function addPreset() {
    const newId = Date.now().toString()
    const newPreset = { id: newId, name: 'Nieuw preset', CellW_mm: 300, CellAspect: 1.667 }
    setLinkedPresets(prev => new Set([...prev, newId]))
    onCellPresetsChange([...cellPresets, newPreset])
  }

  const defaultH = defaultAspect > 0
    ? Math.round(300 / defaultAspect * 10) / 10
    : '—'

  return (
    <div>
      {/* ── Standaard aspect ratio ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 mb-2">
          Standaard aspect ratio
        </p>
        <p className="text-xs text-blue-400 mb-3">
          De aspect ratio die gebruikt wordt bij "Aangepast" modus (geen preset). Wijzigen past ook het huidig geladen formaat aan.
        </p>
        <div className="flex items-center gap-3">
          <label className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-wide text-blue-400 leading-none">Aspect (B÷H)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={defaultAspect}
                step={0.001}
                min={0.1}
                onChange={e => onDefaultAspectChange(parseFloat(e.target.value) || 1.667)}
                className="w-20 text-sm px-2 py-1.5 border border-blue-200 rounded text-right tabular-nums font-semibold focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
              />
            </div>
          </label>
          <div className="text-xs text-blue-400">
            <span className="font-semibold text-blue-600">{defaultAspect}</span> ≈ {Math.round(defaultAspect * 100)}:100
          </div>
          <div className="ml-auto flex gap-3 text-xs text-blue-400">
            {[
              { label: '16:9', val: 1.778 },
              { label: '4:3', val: 1.333 },
              { label: '5:3', val: 1.667 },
              { label: '3:2', val: 1.5 },
            ].map(({ label, val }) => (
              <button key={label} onClick={() => onDefaultAspectChange(val)}
                className={`px-2 py-1 rounded border transition-colors font-semibold ${
                  Math.abs(defaultAspect - val) < 0.002
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-blue-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Presets ── */}
      <p className="text-xs text-gray-400 mb-3">
        Definieer presets met naam, celafmeting en gutter. Een preset stelt in de toolbar automatisch de cel én de gutter in.
      </p>
      {cellPresets.length === 0 && (
        <p className="text-xs text-gray-400 italic mb-4">Nog geen presets gedefinieerd.</p>
      )}
      <div className="space-y-2 mb-4">
        {/* Column headers */}
        {cellPresets.length > 0 && (
          <div className="grid grid-cols-[1fr_86px_72px_66px_66px_20px_66px_28px] gap-1.5 items-center px-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Naam</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Breedte</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Aspect</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Hoogte</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Gut.H</span>
            <span></span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Gut.V</span>
            <span></span>
          </div>
        )}
        {cellPresets.map(p => {
          const h = p.CellW_mm && p.CellAspect ? Math.round(p.CellW_mm / p.CellAspect * 10) / 10 : 0

          function numField(field, val, step, placeholder) {
            return (
              <input
                type="number"
                value={val ?? ''}
                step={step}
                min={0}
                placeholder={placeholder}
                onChange={e => {
                  const v = e.target.value === '' ? null : parseFloat(e.target.value)
                  updatePreset(p.id, field, v)
                }}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white placeholder-gray-300"
              />
            )
          }

          const isLinked = linkedPresets.has(p.id)
          return (
            <div key={p.id} className="grid grid-cols-[1fr_86px_72px_66px_66px_20px_66px_28px] gap-1.5 items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <input
                type="text"
                value={p.name}
                onChange={e => updatePreset(p.id, 'name', e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none w-full"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={p.CellW_mm}
                  step={1}
                  min={1}
                  onChange={e => updatePreset(p.id, 'CellW_mm', parseFloat(e.target.value) || 1)}
                  className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                />
                <span className="text-[10px] text-gray-400 flex-shrink-0">mm</span>
              </div>
              <input
                type="number"
                value={p.CellAspect}
                step={0.001}
                min={0.1}
                onChange={e => updatePreset(p.id, 'CellAspect', parseFloat(e.target.value) || 1)}
                className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
              />
              <div className="text-xs text-gray-400 tabular-nums text-right">{h}<span className="text-[10px] ml-0.5">mm</span></div>
              {numField('GutterX_mm', p.GutterX_mm, 0.5, '—')}
              <PresetLinkBtn linked={isLinked} onToggle={() => toggleLink(p.id)} />
              {numField('GutterY_mm', p.GutterY_mm, 0.5, '—')}
              <button onClick={() => deletePreset(p.id)} title="Verwijderen"
                className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>
      <button
        onClick={addPreset}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-400 rounded-lg px-4 py-2 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 1v10M1 6h10"/>
        </svg>
        Nieuw preset toevoegen
      </button>

    </div>
  )
}

// ─── Tab: Canvas ──────────────────────────────────────────────────────────────
function CanvasTab({ canvasPresets, onCanvasPresetsChange }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Sla veelgebruikte canvasformaten op als preset.
      </p>
      {canvasPresets.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-[1fr_86px_86px_28px] gap-1.5 items-center px-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Naam</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Breedte</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Hoogte</span>
            <span></span>
          </div>
          {canvasPresets.map(p => (
            <div key={p.id} className="grid grid-cols-[1fr_86px_86px_28px] gap-1.5 items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
              <input
                type="text"
                value={p.name}
                onChange={e => onCanvasPresetsChange(canvasPresets.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))}
                className="text-sm font-semibold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none w-full"
              />
              <div className="flex items-center gap-1">
                <input type="number" value={p.CanvasWidth_mm} step={1} min={1}
                  onChange={e => onCanvasPresetsChange(canvasPresets.map(x => x.id === p.id ? { ...x, CanvasWidth_mm: parseFloat(e.target.value) || 1 } : x))}
                  className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                />
                <span className="text-[10px] text-gray-400 flex-shrink-0">mm</span>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" value={p.CanvasHeight_mm} step={1} min={1}
                  onChange={e => onCanvasPresetsChange(canvasPresets.map(x => x.id === p.id ? { ...x, CanvasHeight_mm: parseFloat(e.target.value) || 1 } : x))}
                  className="w-full text-xs px-1.5 py-1 border border-gray-200 rounded text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                />
                <span className="text-[10px] text-gray-400 flex-shrink-0">mm</span>
              </div>
              <button onClick={() => onCanvasPresetsChange(canvasPresets.filter(x => x.id !== p.id))} title="Verwijderen"
                className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {canvasPresets.length === 0 && (
        <p className="text-xs text-gray-400 italic mb-4">Nog geen canvas presets gedefinieerd.</p>
      )}
      <button
        onClick={() => onCanvasPresetsChange([...canvasPresets, { id: `canvas_${Date.now()}`, name: 'Nieuw preset', CanvasWidth_mm: 4000, CanvasHeight_mm: 2300 }])}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-400 rounded-lg px-4 py-2 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 1v10M1 6h10"/>
        </svg>
        Nieuw canvas preset toevoegen
      </button>
    </div>
  )
}

// ─── KoepelsList — toont events per koepel, met toevoegen/verwijderen ─────────
function KoepelsList({ eventGroups, events, onAdd, onRename, onDelete, onSetEventKoepel }) {
  const [newVal, setNewVal] = useState('')
  const [renaming, setRenaming] = useState(null)
  const renameRef = useRef(null)

  const koepelNames = Object.keys(eventGroups)

  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50 mb-4">
      {/* Header */}
      <div className="px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
          Koepels <span className="font-normal opacity-50">({koepelNames.length})</span>
        </span>
      </div>

      <div className="px-4 pb-3 space-y-2">
        {koepelNames.length === 0 && (
          <p className="text-xs text-teal-400 italic">Nog geen koepels aangemaakt.</p>
        )}

        {koepelNames.map(grp => {
          const assignedEvents = eventGroups[grp] || []
          // Events not yet in this koepel (and not in any other — to allow moving)
          const available = events.filter(ev => !assignedEvents.includes(ev))

          return (
            <div key={grp} className="bg-white border border-teal-200 rounded-lg p-3">
              {/* Koepel name row */}
              <div className="flex items-center gap-2 mb-2">
                {renaming === grp ? (
                  <>
                    <input
                      ref={renameRef}
                      autoFocus
                      defaultValue={grp}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { onRename(grp, renameRef.current.value); setRenaming(null) }
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      className="flex-1 text-sm font-bold px-2 py-0.5 border border-blue-300 rounded focus:outline-none"
                    />
                    <button
                      onMouseDown={e => { e.preventDefault(); onRename(grp, renameRef.current.value); setRenaming(null) }}
                      className="text-[10px] text-blue-600 font-semibold"
                    >OK</button>
                    <button onMouseDown={() => setRenaming(null)} className="text-[10px] text-gray-400">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-bold text-teal-800">{grp}</span>
                    <button onClick={() => setRenaming(grp)} title="Hernoemen"
                      className="text-teal-400 hover:text-teal-600 transition-colors">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
                    </button>
                    <button onClick={() => onDelete(grp)} title="Verwijderen"
                      className="text-teal-300 hover:text-red-500 transition-colors">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
                    </button>
                  </>
                )}
              </div>

              {/* Assigned events as removable chips */}
              <div className="flex flex-wrap gap-1.5">
                {assignedEvents.length === 0 && (
                  <span className="text-[10px] text-teal-300 italic">Geen events toegewezen</span>
                )}
                {assignedEvents.map(ev => (
                  <span key={ev}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                    {ev}
                    <button
                      onClick={() => onSetEventKoepel(ev, '')}
                      title={`${ev} verwijderen uit ${grp}`}
                      className="text-teal-400 hover:text-red-500 transition-colors leading-none"
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2L2 8"/>
                      </svg>
                    </button>
                  </span>
                ))}

                {/* Add event dropdown */}
                {available.length > 0 && (
                  <select
                    value=""
                    onChange={e => { if (e.target.value) onSetEventKoepel(e.target.value, grp) }}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-teal-300 text-teal-500 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
                  >
                    <option value="">+ event toevoegen</option>
                    {available.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                )}
              </div>
            </div>
          )
        })}

        {/* Add new koepel */}
        <div className="flex gap-1 pt-1">
          <input
            type="text"
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newVal.trim()) { onAdd(newVal.trim()); setNewVal('') } }}
            placeholder="Nieuw..."
            className="flex-1 text-xs px-2 py-1 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
          />
          <button
            onClick={() => { if (newVal.trim()) { onAdd(newVal.trim()); setNewVal('') } }}
            className="text-xs px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded font-semibold transition-colors"
          >+</button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Events & Koepels ────────────────────────────────────────────────────
function EventsKoepelsTab({ events, onAddEvent, onDeleteEvent, onRenameEvent, eventGroups, onAddEventGroup, onDeleteEventGroup, onRenameEventGroup, onSetEventKoepel }) {
  const [newEventVal, setNewEventVal] = useState('')
  const [renamingEvent, setRenamingEvent] = useState(null)
  const renamingEventRef = useRef(null)

  function getEventKoepel(eventCode) {
    for (const [grp, evs] of Object.entries(eventGroups)) {
      if (evs.includes(eventCode)) return grp
    }
    return ''
  }

  return (
    <div>
      {/* Koepels — custom UI met event-overzicht */}
      <KoepelsList
        eventGroups={eventGroups}
        events={events}
        onAdd={onAddEventGroup}
        onRename={onRenameEventGroup}
        onDelete={onDeleteEventGroup}
        onSetEventKoepel={onSetEventKoepel}
      />

      {/* Events */}
      <div className="rounded-lg border border-orange-100 bg-orange-50">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-orange-700">
            Events <span className="font-normal opacity-50">({events.length})</span>
          </span>
        </div>
        <div className="px-4 pb-3">
          {/* Column headers */}
          {events.length > 0 && (
            <div className="grid grid-cols-[1fr_140px_auto_auto] gap-2 items-center mb-1 px-1">
              <span className="text-[10px] uppercase tracking-wide text-orange-400 font-semibold">Event</span>
              <span className="text-[10px] uppercase tracking-wide text-orange-400 font-semibold">Koepel</span>
              <span></span>
              <span></span>
            </div>
          )}
          {(() => {
            // Group events by koepel, sort alphabetically within each group
            const grouped = {}
            const ungrouped = []
            events.forEach(ev => {
              const koepel = getEventKoepel(ev)
              if (koepel) {
                if (!grouped[koepel]) grouped[koepel] = []
                grouped[koepel].push(ev)
              } else {
                ungrouped.push(ev)
              }
            })
            Object.keys(grouped).forEach(k => grouped[k].sort())
            ungrouped.sort()
            const sortedGroups = Object.keys(grouped).sort()

            function renderRow(ev) {
              return (
                <div key={ev} className="grid grid-cols-[1fr_140px_auto_auto] gap-2 items-center">
                  {renamingEvent === ev ? (
                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        ref={renamingEventRef}
                        autoFocus
                        defaultValue={ev}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { onRenameEvent(ev, renamingEventRef.current.value); setRenamingEvent(null) }
                          if (e.key === 'Escape') setRenamingEvent(null)
                        }}
                        className="flex-1 text-xs px-2 py-0.5 border border-blue-300 rounded focus:outline-none"
                      />
                      <button onMouseDown={e => { e.preventDefault(); onRenameEvent(ev, renamingEventRef.current.value); setRenamingEvent(null) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
                      <button onMouseDown={() => setRenamingEvent(null)} className="text-[10px] text-gray-400">✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">{ev}</span>
                      <select
                        value={getEventKoepel(ev)}
                        onChange={e => onSetEventKoepel(ev, e.target.value)}
                        className="text-xs px-1.5 py-0.5 border border-orange-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white text-gray-700"
                      >
                        <option value="">— geen koepel —</option>
                        {Object.keys(eventGroups).map(grp => <option key={grp} value={grp}>{grp}</option>)}
                      </select>
                    </>
                  )}
                  {renamingEvent !== ev && (
                    <>
                      <button onClick={() => setRenamingEvent(ev)} title="Hernoemen" className="text-orange-400 hover:text-orange-600 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
                      </button>
                      <button onClick={() => onDeleteEvent(ev)} title="Verwijderen" className="text-orange-300 hover:text-red-500 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
                      </button>
                    </>
                  )}
                </div>
              )
            }

            return (
              <div className="space-y-3 mb-2">
                {sortedGroups.map(grp => (
                  <div key={grp}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-1 px-1 border-b border-orange-100 pb-0.5">{grp}</p>
                    <div className="space-y-1">{grouped[grp].map(ev => renderRow(ev))}</div>
                  </div>
                ))}
                {ungrouped.length > 0 && (
                  <div>
                    {sortedGroups.length > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300 mb-1 px-1 border-b border-orange-100 pb-0.5">Geen koepel</p>
                    )}
                    <div className="space-y-1">{ungrouped.map(ev => renderRow(ev))}</div>
                  </div>
                )}
              </div>
            )
          })()}
          <div className="flex gap-1">
            <input
              type="text"
              value={newEventVal}
              onChange={e => setNewEventVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onAddEvent(newEventVal); setNewEventVal('') } }}
              placeholder="Nieuw event (bijv. AGR)..."
              className="flex-1 text-xs px-2 py-1 border border-orange-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
            />
            <button
              onClick={() => { onAddEvent(newEventVal); setNewEventVal('') }}
              className="text-xs px-2 py-1 bg-orange-500 text-white rounded font-semibold hover:bg-orange-600 transition-colors"
            >+</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Categorieën ─────────────────────────────────────────────────────────
function CategorieenTab({ categoryList, onAddCategory, onDeleteCategory, onRenameCategory, onReorderCategoryList }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        De volgorde bepaalt de prioriteit bij het filteren van sponsors. Hogere categorieën verschijnen bovenaan in de logo-bibliotheek.
      </p>
      <ManageList
        title="Categorieën"
        color="purple"
        items={categoryList}
        onAdd={onAddCategory}
        onRename={onRenameCategory}
        onDelete={onDeleteCategory}
        onReorder={onReorderCategoryList}
      />
    </div>
  )
}

// ─── Main SettingsModal ───────────────────────────────────────────────────────
export default function SettingsModal({
  onClose,
  cellPresets,
  onCellPresetsChange,
  canvasPresets,
  onCanvasPresetsChange,
  defaultAspect,
  onDefaultAspectChange,
  events,
  onAddEvent,
  onDeleteEvent,
  onRenameEvent,
  eventGroups,
  onAddEventGroup,
  onDeleteEventGroup,
  onRenameEventGroup,
  onSetEventKoepel,
  categoryList,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onReorderCategoryList,
}) {
  const [activeTab, setActiveTab] = useState('Celdimensies')

  return (
    <AnimatePresence>
    <motion.div
      variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <circle cx="9" cy="9" r="3"/>
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"/>
            </svg>
            <h2 className="text-base font-bold text-gray-900">Instellingen</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'Celdimensies' && (
            <CelDimensiesTab
              cellPresets={cellPresets}
              onCellPresetsChange={onCellPresetsChange}
              defaultAspect={defaultAspect}
              onDefaultAspectChange={onDefaultAspectChange}
            />
          )}
          {activeTab === 'Canvas' && (
            <CanvasTab
              canvasPresets={canvasPresets}
              onCanvasPresetsChange={onCanvasPresetsChange}
            />
          )}
          {activeTab === 'Events & Koepels' && (
            <EventsKoepelsTab
              events={events}
              onAddEvent={onAddEvent}
              onDeleteEvent={onDeleteEvent}
              onRenameEvent={onRenameEvent}
              eventGroups={eventGroups}
              onAddEventGroup={onAddEventGroup}
              onDeleteEventGroup={onDeleteEventGroup}
              onRenameEventGroup={onRenameEventGroup}
              onSetEventKoepel={onSetEventKoepel}
            />
          )}
          {activeTab === 'Categorieën' && (
            <CategorieenTab
              categoryList={categoryList}
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
              onRenameCategory={onRenameCategory}
              onReorderCategoryList={onReorderCategoryList}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}
