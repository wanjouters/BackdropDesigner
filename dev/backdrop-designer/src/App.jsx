import { useState, useEffect } from 'react'
import './index.css'
import GridTypeSelector from './components/GridTypeSelector'
import GridCanvas from './components/GridCanvas'
import FrequencyPanel from './components/FrequencyPanel'
import ExportButton from './components/ExportButton'
import CustomFormatModal from './components/CustomFormatModal'
import LogoLibrary from './components/LogoLibrary'
import GridToolbar from './components/GridToolbar'
import PreviewCanvas from './components/PreviewCanvas'
import { exportJpeg } from './utils/exportJpeg'
import { loadCustomLogos, saveCustomLogos, loadSavedDesigns, saveDesignsList } from './utils/sponsorTags'

function makeEmptySlots(cols, rows) {
  return Array(cols * rows).fill('BLANK')
}

// Resize slots array when cols/rows change, preserving existing values where possible
function resizeSlots(oldSlots, oldCols, newCols, newRows) {
  const oldRows = oldCols > 0 ? Math.ceil(oldSlots.length / oldCols) : 0
  const next = []
  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      next.push(r < oldRows && c < oldCols ? (oldSlots[r * oldCols + c] || 'BLANK') : 'BLANK')
    }
  }
  return next
}

function SavedDesignsPanel({ designs, currentFormatCode, renamingDesign, onLoad, onDelete, onRename, onStartRename }) {
  const [collapsed, setCollapsed] = useState(designs.length === 0)
  const renameRef = useState(null)
  const inputRef = { current: null }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex-shrink-0">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 1h8l2 2v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
            <path d="M9 1v4H4V1"/>
          </svg>
          Opgeslagen
          {designs.length > 0 && <span className="text-xs text-gray-400 font-normal">({designs.length})</span>}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100">
          {designs.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">Nog geen opgeslagen ontwerpen.</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {designs.map(d => (
                <div key={d.id} className="px-3 py-2 hover:bg-gray-50 transition-colors group">
                  {renamingDesign === d.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={el => { inputRef.current = el }}
                        autoFocus
                        defaultValue={d.name}
                        onKeyDown={e => {
                          if (e.key === 'Enter') onRename(d.id, inputRef.current.value)
                          if (e.key === 'Escape') onStartRename(null)
                        }}
                        className="flex-1 text-xs px-2 py-0.5 border border-blue-400 rounded focus:outline-none"
                      />
                      <button onMouseDown={e => { e.preventDefault(); onRename(d.id, inputRef.current.value) }} className="text-[10px] text-blue-600 font-semibold">OK</button>
                      <button onMouseDown={() => onStartRename(null)} className="text-[10px] text-gray-400">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onLoad(d)} className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{d.name}</p>
                        <p className="text-[10px] text-gray-400">{d.formatCode} · {new Date(d.savedAt).toLocaleDateString('nl-BE')}</p>
                      </button>
                      <button onClick={() => onStartRename(d.id)} title="Hernoemen" className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
                      </button>
                      <button onClick={() => onDelete(d.id)} title="Verwijderen" className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [editedFormat, setEditedFormat] = useState(null)
  const [slots, setSlots] = useState([])
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [view, setView] = useState('grid') // 'grid' | 'preview'
  const [customLogos, setCustomLogos] = useState(() => loadCustomLogos())
  const [savedDesigns, setSavedDesigns] = useState(() => loadSavedDesigns())
  const [saveNameInput, setSaveNameInput] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [renamingDesign, setRenamingDesign] = useState(null)
  const [advanceDir, setAdvanceDirState] = useState(() => localStorage.getItem('backdropDesigner_advanceDir') || 'r')

  function setAdvanceDir(dir) {
    setAdvanceDirState(dir)
    localStorage.setItem('backdropDesigner_advanceDir', dir)
  }

  function handleCustomLogoChange(sponsorName, dataUrl) {
    const next = { ...customLogos }
    if (dataUrl) next[sponsorName] = dataUrl
    else delete next[sponsorName]
    setCustomLogos(next)
    saveCustomLogos(next)
  }

  function handleSaveDesign() {
    const name = saveNameInput.trim() || `${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`
    const design = {
      id: Date.now(),
      name,
      formatCode: editedFormat?.Code || '',
      format: { ...editedFormat },
      slots: [...slots],
      savedAt: Date.now(),
    }
    const next = [design, ...savedDesigns]
    setSavedDesigns(next)
    saveDesignsList(next)
    setSaveNameInput('')
    setShowSaveInput(false)
  }

  function handleLoadDesign(design) {
    setEditedFormat({ ...design.format })
    setSelectedFormat({ ...design.format })
    setSlots([...design.slots])
    setSelectedSlots(new Set())
  }

  function handleDeleteDesign(id) {
    const next = savedDesigns.filter(d => d.id !== id)
    setSavedDesigns(next)
    saveDesignsList(next)
  }

  function handleRenameDesign(id, newName) {
    const val = newName.trim()
    if (!val) return
    const next = savedDesigns.map(d => d.id === id ? { ...d, name: val } : d)
    setSavedDesigns(next)
    saveDesignsList(next)
    setRenamingDesign(null)
  }

  function handleSelectFormat(format) {
    setSelectedFormat(format)
    setEditedFormat({ ...format })
    setSlots(makeEmptySlots(format.Cols, format.Rows))
    setSelectedSlots(new Set())
  }

  function handleCustomFormat(format) {
    setShowCustomModal(false)
    handleSelectFormat(format)
  }

  function handleFormatChange(updated) {
    const prevCols = editedFormat.Cols
    const prevRows = editedFormat.Rows
    setEditedFormat(updated)
    if (updated.Cols !== prevCols || updated.Rows !== prevRows) {
      setSlots(prev => resizeSlots(prev, prevCols, updated.Cols, updated.Rows))
      setSelectedSlots(new Set())
    }
  }

  function handleClearGrid() {
    if (editedFormat) {
      setSlots(makeEmptySlots(editedFormat.Cols, editedFormat.Rows))
      setSelectedSlots(new Set())
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (selectedSlots.size === 0) return
      e.preventDefault()
      const next = [...slots]
      selectedSlots.forEach(i => { next[i] = 'BLANK' })
      setSlots(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedSlots, slots])

  function handleSelectSlot(index, shiftKey) {
    setSelectedSlots(prev => {
      const next = new Set(prev)
      if (shiftKey) {
        if (next.has(index)) next.delete(index)
        else next.add(index)
      } else {
        if (next.size === 1 && next.has(index)) next.clear()
        else { next.clear(); next.add(index) }
      }
      return next
    })
  }

  function handleDropOnSlot(slotIndex, sponsorName) {
    const next = [...slots]
    if (selectedSlots.has(slotIndex) && selectedSlots.size > 1) {
      selectedSlots.forEach(i => { next[i] = sponsorName })
    } else {
      next[slotIndex] = sponsorName
    }
    setSlots(next)
  }

  function handleAssignFromLibrary(sponsorName) {
    if (selectedSlots.size === 0) return
    const next = [...slots]
    selectedSlots.forEach(i => { next[i] = sponsorName })
    setSlots(next)
    if (selectedSlots.size === 1 && advanceDir !== 'none' && format) {
      const cols = format.Cols
      const total = slots.length
      const current = [...selectedSlots][0]
      const row = Math.floor(current / cols)
      const col = current % cols
      const rows = Math.ceil(total / cols)
      const dMap = {
        r:  [0, 1], l:  [0, -1], d:  [1, 0],  u:  [-1, 0],
        dr: [1, 1], dl: [1, -1], ur: [-1, 1], ul: [-1, -1],
      }
      const [dr, dc] = dMap[advanceDir] || [0, 0]
      const nr = row + dr, nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const nextIndex = nr * cols + nc
        if (nextIndex >= 0 && nextIndex < total) setSelectedSlots(new Set([nextIndex]))
      }
    }
  }

  const selectionCount = selectedSlots.size
  const format = editedFormat

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="1" y="1" width="5" height="5" rx="1"/>
              <rect x="8" y="1" width="5" height="5" rx="1"/>
              <rect x="1" y="8" width="5" height="5" rx="1"/>
              <rect x="8" y="8" width="5" height="5" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-none">BackdropDesigner</h1>
            <p className="text-xs text-gray-400 mt-0.5">Flanders Classics</p>
          </div>
        </div>

        {format && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{format.Code}</p>
              <p className="text-xs text-gray-400">
                {format.Cols}×{format.Rows} = {format.Cols * format.Rows} slots
                {selectionCount > 0 && (
                  <span className="ml-2 text-blue-500">
                    · {selectionCount} {selectionCount === 1 ? 'slot' : 'slots'} geselecteerd
                  </span>
                )}
              </p>
            </div>
            {showSaveInput ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={saveNameInput}
                  onChange={e => setSaveNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveDesign(); if (e.key === 'Escape') setShowSaveInput(false) }}
                  placeholder={`${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`}
                  className="text-xs px-2.5 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-52"
                />
                <button onClick={handleSaveDesign} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Opslaan</button>
                <button onClick={() => setShowSaveInput(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                  <path d="M8 1v4H4V1M4 7h4"/>
                </svg>
                Opslaan
              </button>
            )}
            <button
              onClick={handleClearGrid}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-red-300 transition-colors"
            >
              Wissen
            </button>
            <button
              onClick={() => exportJpeg(format, slots, customLogos)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="1" width="12" height="12" rx="2"/>
                <path d="M1 9l3-3 2 2 3-4 4 5"/>
              </svg>
              JPEG
            </button>
            <ExportButton format={format} slots={slots} />
          </div>
        )}
      </header>

      {/* Main layout — 3 columns */}
      <div className="flex gap-4 p-4 flex-1 overflow-hidden min-h-0">

        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Saved designs panel */}
          <SavedDesignsPanel
            designs={savedDesigns}
            currentFormatCode={editedFormat?.Code}
            renamingDesign={renamingDesign}
            onLoad={handleLoadDesign}
            onDelete={handleDeleteDesign}
            onRename={handleRenameDesign}
            onStartRename={setRenamingDesign}
          />

          <GridTypeSelector
            selected={selectedFormat}
            onSelect={handleSelectFormat}
            onCustom={() => setShowCustomModal(true)}
          />
          {format && (
            <>
              <FrequencyPanel slots={slots} />
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Formaat info
                </h2>
                <dl className="space-y-1">
                  {[
                    ['Categorie', format.Categorie],
                    ['Event', format.EventStyle],
                    format.Variant && ['Variant', format.Variant],
                    format.CanvasWidth_mm && ['Canvas', `${format.CanvasWidth_mm} × ${format.CanvasHeight_mm} mm`],
                  ].filter(Boolean).map(([label, value]) => value && (
                    <div key={label} className="flex justify-between text-xs">
                      <dt className="text-gray-400">{label}</dt>
                      <dd className="text-gray-700 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}
        </div>

        {/* Center — toolbar + grid/preview */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">

          {format && (
            <>
              {/* View toggle + toolbar row */}
              <div className="flex items-start gap-3">
                {/* View toggle */}
                <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setView('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      view === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="0" y="0" width="5" height="5" rx="1"/>
                      <rect x="7" y="0" width="5" height="5" rx="1"/>
                      <rect x="0" y="7" width="5" height="5" rx="1"/>
                      <rect x="7" y="7" width="5" height="5" rx="1"/>
                    </svg>
                    Grid
                  </button>
                  <button
                    onClick={() => setView('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      view === 'preview'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="2" width="10" height="8" rx="1.5"/>
                      <path d="M4 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
                    </svg>
                    Preview
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex-1 min-w-0">
                  <GridToolbar format={format} onChange={handleFormatChange} />
                </div>
              </div>
            </>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!format ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <rect x="2" y="2" width="10" height="10" rx="2"/>
                      <rect x="16" y="2" width="10" height="10" rx="2"/>
                      <rect x="2" y="16" width="10" height="10" rx="2"/>
                      <rect x="16" y="16" width="10" height="10" rx="2"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Selecteer een backdrop-formaat links</p>
                  <p className="text-gray-300 text-xs mt-1">of maak een nieuw formaat aan</p>
                </div>
              </div>
            ) : view === 'grid' ? (
              <div
                className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 p-4"
                onClick={e => { if (e.target === e.currentTarget) setSelectedSlots(new Set()) }}
              >
                <GridCanvas
                  format={format}
                  slots={slots}
                  onSlotsChange={setSlots}
                  selectedSlots={selectedSlots}
                  onSelectSlot={handleSelectSlot}
                  onDropSponsor={handleDropOnSlot}
                />
              </div>
            ) : (
              <PreviewCanvas
                format={format}
                slots={slots}
                selectedSlots={selectedSlots}
                onSelectSlot={handleSelectSlot}
                onDropSponsor={handleDropOnSlot}
                customLogos={customLogos}
              />
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col min-h-0">
          <LogoLibrary
            selectedSlots={selectedSlots}
            onAssign={handleAssignFromLibrary}
            customLogos={customLogos}
            onCustomLogoChange={handleCustomLogoChange}
            advanceDir={advanceDir}
            onAdvanceDirChange={setAdvanceDir}
          />
        </div>

      </div>

      {showCustomModal && (
        <CustomFormatModal
          onConfirm={handleCustomFormat}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>
  )
}
