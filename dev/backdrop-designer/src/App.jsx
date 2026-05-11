import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'
import allStaticFormats from './data/backdropFormats.json'
import GridTypeSelector from './components/GridTypeSelector'
import GridCanvas from './components/GridCanvas'
import FrequencyPanel from './components/FrequencyPanel'
import LogoLibrary from './components/LogoLibrary'
import GridToolbar from './components/GridToolbar'
import PreviewCanvas from './components/PreviewCanvas'
import SavedDesignsPanel from './components/designs/SavedDesignsPanel'
import SaveModal from './components/designs/SaveModal'
import Toast from './components/shared/Toast'
import ConfirmModal from './components/shared/ConfirmModal'
import ExportMenu from './components/export/ExportMenu'
import { useAuth } from './hooks/useAuth'
import { useAppData } from './hooks/useAppData'
import { saveDraft, loadDraft, clearDraft } from './utils/sponsorTags'
import * as db from './utils/db'

const DIR_GRID = [
  ['ul','u','ur'],
  ['l','none','r'],
  ['dl','d','dr'],
]
const DIR_ARROWS = {
  ul:'↖', u:'↑', ur:'↗',
  l:'←', none:'·', r:'→',
  dl:'↙', d:'↓', dr:'↘',
}

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
export default function App({ session: initialSession }) {
  // Auth (session + dropdown menu) is managed by useAuth
  const { authSession, authMenuOpen, setAuthMenuOpen, authMenuRef, signOut } = useAuth(initialSession)

  // All persisted data is loaded from Supabase via useAppData
  const {
    savedDesigns, setSavedDesigns,
    tags,
    sponsorCategories,
    events,
    categoryList,
    eventGroups,
    sponsorGroups,
    cellPresets,
    canvasPresets,
    backgroundPresets,
    customFormats,
    customSponsors,
    customLogos,
    staticImported,
    sponsors,
  } = useAppData()

  // Local UI / design state
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [editedFormat, setEditedFormat] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [view, setView] = useState('preview') // 'grid' | 'preview'
  const [showRuler, setShowRuler] = useState(false)
  const [activeOverlay, setActiveOverlay] = useState(null) // null | 'person' | 'chair'
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveModalDefaults, setSaveModalDefaults] = useState(null)
  const [renamingDesign, setRenamingDesign] = useState(null)
  const [advanceDir, setAdvanceDirState] = useState(() => localStorage.getItem('backdropDesigner_advanceDir') || 'r')
  const [confirmAction, setConfirmAction] = useState(null)   // { message, onConfirm, confirmLabel, variant }
  const [draftRestoreData, setDraftRestoreData] = useState(null)
  const [toast, setToast] = useState(null)          // { message, type }
  const [isDirty, setIsDirty] = useState(false)
  const [loadedDesignId, setLoadedDesignId] = useState(null) // id of the currently loaded saved design
  const [leftPanel, setLeftPanel] = useState('formats') // null | 'designs' | 'formats' | 'adjust' | 'frequency'
  const hasMounted = useRef(false)
  const skipNextDirtyMark = useRef(false)

  // ─── Confirm helper ───────────────────────────────────────────────────────
  function askConfirm(message, onConfirm, confirmLabel = 'Verwijderen', variant = 'danger') {
    setConfirmAction({ message, onConfirm, confirmLabel, variant })
  }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  // ─── Auto-save draft + dirty tracking ────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    if (!editedFormat) return
    saveDraft({ format: editedFormat, slots, savedAt: Date.now() })
    if (skipNextDirtyMark.current) { skipNextDirtyMark.current = false; return }
    setIsDirty(true)
  }, [slots, editedFormat])

  // ─── Load draft on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.format && Array.isArray(draft.slots)) setDraftRestoreData(draft)
  }, [])

  function setAdvanceDir(dir) {
    setAdvanceDirState(dir)
    localStorage.setItem('backdropDesigner_advanceDir', dir)
  }

  function handleImportJson(data) {
    const doImport = () => {
      skipNextDirtyMark.current = true
      setIsDirty(false)
      setLoadedDesignId(null)
      setEditedFormat({ ...data.format })
      setSelectedFormat({ ...data.format })
      setSlots([...data.slots])
      setSelectedSlots(new Set())
      clearDraft()
      showToast('Ontwerp geladen vanuit JSON', 'info')
    }
    const hasFilled = slots.some(s => s && s !== 'BLANK')
    if (hasFilled) {
      askConfirm('Huidig ontwerp vervangen door het geïmporteerde JSON-bestand?', doImport, 'Importeren', 'warning')
    } else {
      doImport()
    }
  }

  function handleBulkReplace(from, to) {
    setSlots(slots.map(s => s === from ? to : s))
    showToast(`Alle "${from}" vervangen door "${to}"`, 'success')
  }

  async function handleSaveDesign({ name }) {
    const designName = name || `${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`
    try {
      const id = await db.saveDesign({
        name: designName,
        formatCode: editedFormat?.Code || '',
        format: { ...editedFormat },
        slots: [...slots],
        folder: null,
      })
      const newDesign = {
        id,
        name: designName,
        formatCode: editedFormat?.Code || '',
        format: { ...editedFormat },
        slots: [...slots],
        folder: null,
        savedAt: new Date().toISOString(),
      }
      setSavedDesigns(prev => [newDesign, ...prev])
      setLoadedDesignId(id)
      setShowSaveModal(false)
      setSaveModalDefaults(null)
      clearDraft()
      setIsDirty(false)
      showToast('Ontwerp opgeslagen', 'success')
    } catch (err) {
      console.error(err)
      showToast('Fout bij opslaan', 'error')
    }
  }

  async function handleDuplicateDesign(design) {
    try {
      const newId = await db.duplicateDesign(design.id)
      const copy = {
        ...design,
        id: newId,
        name: design.name + ' (kopie)',
        savedAt: new Date().toISOString(),
      }
      setSavedDesigns(prev => [copy, ...prev])
      showToast('"' + copy.name + '" aangemaakt', 'success')
    } catch (err) {
      console.error(err)
      showToast('Fout bij dupliceren', 'error')
    }
  }

  async function handleUpdateDesign() {
    if (!loadedDesignId) return
    try {
      await db.updateDesign({
        id: loadedDesignId,
        name: savedDesigns.find(d => d.id === loadedDesignId)?.name || 'Ontwerp',
        formatCode: editedFormat?.Code || '',
        format: { ...editedFormat },
        slots: [...slots],
        folder: savedDesigns.find(d => d.id === loadedDesignId)?.folder || null,
      })
      setSavedDesigns(prev => prev.map(d =>
        d.id === loadedDesignId
          ? { ...d, format: { ...editedFormat }, slots: [...slots], savedAt: new Date().toISOString() }
          : d
      ))
      clearDraft()
      setIsDirty(false)
      const design = savedDesigns.find(d => d.id === loadedDesignId)
      showToast(`"${design?.name || 'Ontwerp'}" bijgewerkt`, 'success')
    } catch (err) {
      console.error(err)
      showToast('Fout bij bijwerken', 'error')
    }
  }

  function handleLoadDesign(design) {
    skipNextDirtyMark.current = true
    setIsDirty(false)
    setLoadedDesignId(design.id)
    setEditedFormat({ ...design.format })
    setSelectedFormat({ ...design.format })
    setSlots([...design.slots])
    setSelectedSlots(new Set())
    clearDraft()
    showToast(`"${design.name}" geladen`, 'info')
  }

  function handleDeleteDesign(id) {
    const design = savedDesigns.find(d => d.id === id)
    const name = design ? `"${design.name}"` : 'dit ontwerp'
    askConfirm(`Ontwerp ${name} definitief verwijderen?`, async () => {
      try {
        await db.deleteDesign(id)
        setSavedDesigns(prev => prev.filter(d => d.id !== id))
        if (loadedDesignId === id) setLoadedDesignId(null)
        showToast('Ontwerp verwijderd', 'info')
      } catch (err) {
        console.error(err)
        showToast('Fout bij verwijderen', 'error')
      }
    })
  }

  async function handleRenameDesign(id, newName) {
    const val = newName.trim()
    if (!val) return
    try {
      await db.renameDesign(id, val)
      setSavedDesigns(prev => prev.map(d => d.id === id ? { ...d, name: val } : d))
      setRenamingDesign(null)
    } catch (err) {
      console.error(err)
    }
  }

  function handleSelectFormat(format) {
    const doSelect = () => {
      skipNextDirtyMark.current = true
      setIsDirty(false)
      setLoadedDesignId(null)
      setSelectedFormat(format)
      setEditedFormat({ ...format })
      setSlots(makeEmptySlots(format.Cols, format.Rows))
      setSelectedSlots(new Set())
      clearDraft()
    }
    const filled = slots.filter(s => s !== 'BLANK').length
    if (filled > 0) {
      askConfirm(
        `Het huidige ontwerp heeft ${filled} ingevulde slot${filled > 1 ? 's' : ''}. Bij het wisselen van formaat gaan deze verloren. Doorgaan?`,
        doSelect, 'Doorgaan', 'warning'
      )
    } else {
      doSelect()
    }
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
    if (!editedFormat) return
    const filled = slots.filter(s => s !== 'BLANK').length
    if (filled === 0) return
    askConfirm(
      `Alle ${filled} ingevulde slot${filled > 1 ? 's' : ''} wissen?`,
      () => { setSlots(makeEmptySlots(editedFormat.Cols, editedFormat.Rows)); setSelectedSlots(new Set()); showToast('Grid gewist', 'info') },
      'Wissen'
    )
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

  // Option/Alt + sleep: voeg cel toe aan selectie (nooit wissen)
  function handleSweepSlot(index) {
    setSelectedSlots(prev => {
      if (prev.has(index)) return prev
      return new Set([...prev, index])
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

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast.message + toast.type} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Draft restore banner */}
      {draftRestoreData && (
        <div className="border-b border-gray-100 px-6 py-1 flex items-center gap-3 flex-shrink-0 bg-white">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-orange-400 flex-shrink-0">
            <path d="M7 1v6l3 2"/><circle cx="7" cy="7" r="6"/>
          </svg>
          <span className="text-[11px] text-gray-400 flex-1">
            Niet-opgeslagen werkstand van {new Date(draftRestoreData.savedAt).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })} gevonden
          </span>
          <button
            onClick={() => {
              setEditedFormat({ ...draftRestoreData.format })
              setSelectedFormat({ ...draftRestoreData.format })
              setSlots([...draftRestoreData.slots])
              setSelectedSlots(new Set())
              setDraftRestoreData(null)
            }}
            className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold transition-colors flex-shrink-0">
            Herstellen
          </button>
          <button
            onClick={() => { clearDraft(); setDraftRestoreData(null) }}
            className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
            Negeren
          </button>
        </div>
      )}

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

        <div className="flex items-center gap-3">
          {format && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-sm font-semibold text-gray-800">
                    {loadedDesignId
                      ? (savedDesigns.find(d => d.id === loadedDesignId) || {}).name || format.Code
                      : format.Code}
                  </p>
                  {isDirty && (
                    <span title="Niet-opgeslagen wijzigingen" className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {loadedDesignId ? format.Code + ' · ' : ''}{format.Cols}×{format.Rows} = {format.Cols * format.Rows} slots
                  {selectionCount > 0 && (
                    <span className="ml-2 text-blue-500">
                      · {selectionCount} {selectionCount === 1 ? 'slot' : 'slots'} geselecteerd
                    </span>
                  )}
                </p>
              </div>
              <ExportMenu format={format} slots={slots} customLogos={customLogos} onImportJson={handleImportJson} />
            </div>
          )}

          {/* Account widget */}
          <div className="relative" ref={authMenuRef}>
            {authSession ? (
              <>
                <button
                  onClick={() => setAuthMenuOpen(o => !o)}
                  title={authSession.user.user_metadata?.name || authSession.user.email}
                  className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  {(authSession.user.user_metadata?.name || authSession.user.email)[0].toUpperCase()}
                </button>
                {authMenuOpen && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50" style={{ minWidth: 200 }}>
                    <div className="px-4 py-2 border-b border-gray-100">
                      {authSession.user.user_metadata?.name && (
                        <p className="text-xs font-medium text-gray-800 truncate">{authSession.user.user_metadata.name}</p>
                      )}
                      <p className="text-xs text-gray-400 truncate">{authSession.user.email}</p>
                    </div>
                    {authSession.user.app_metadata?.role === 'admin' ? (
                      <a
                        href="/instellingen"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Instellingen
                      </a>
                    ) : (
                      <a
                        href="/instellingen"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mijn profiel
                      </a>
                    )}
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Uitloggen
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a
                href="/instellingen"
                title="Inloggen"
                className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 flex items-center justify-center hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Icon bar ── */}
        <div className="w-12 bg-gray-900 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {[
            {
              id: 'designs',
              title: 'Opgeslagen ontwerpen',
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h5l2 2h7v10H2z"/>
                  <path d="M6 10h6M6 13h4"/>
                </svg>
              ),
            },
            {
              id: 'formats',
              title: 'Backdrop formaten',
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="6" height="6" rx="1.5"/>
                  <rect x="10" y="2" width="6" height="6" rx="1.5"/>
                  <rect x="2" y="10" width="6" height="6" rx="1.5"/>
                  <rect x="10" y="10" width="6" height="6" rx="1.5"/>
                </svg>
              ),
            },
            {
              id: 'adjust',
              title: 'Formaat aanpassen',
              disabled: !format,
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M3 5h2M9 5h6M3 9h6M13 9h2M3 13h2M9 13h6"/>
                  <circle cx="7" cy="5" r="2"/><circle cx="11" cy="9" r="2"/><circle cx="7" cy="13" r="2"/>
                </svg>
              ),
            },
            {
              id: 'frequency',
              title: 'Frequentie',
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 14V8M7 14V5M11 14V9M15 14V3"/>
                </svg>
              ),
            },
          ].map(({ id, title, icon, disabled }) => (
            <button
              key={id}
              title={title}
              disabled={!!disabled}
              onClick={() => setLeftPanel(p => p === id ? null : id)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
                disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : leftPanel === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {icon}
            </button>
          ))}

        </div>

        {/* ── Side panel — conditional ── */}
        <AnimatePresence initial={false}>
        {leftPanel && (
          <motion.div
            key="side-panel"
            initial={{ width: 0 }}
            animate={{ width: 256 }}
            exit={{ width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden"
          >
          <AnimatePresence mode="wait">
          <motion.div
            key={leftPanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="w-64 flex flex-col h-full"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {leftPanel === 'designs' && 'Opgeslagen'}
                {leftPanel === 'formats' && 'Formaten'}
                {leftPanel === 'adjust' && 'Aanpassen'}
                {leftPanel === 'frequency' && 'Frequentie'}
              </h2>
              <button onClick={() => setLeftPanel(null)} className="p-1 -mr-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Paneel sluiten">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3L3 11"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
              {leftPanel === 'designs' && (
                <div className="flex flex-col h-full gap-2">
                  {format && (
                    <button
                      onClick={() => { setSaveModalDefaults(null); setShowSaveModal(true) }}
                      className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-2 font-semibold transition-colors flex-shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                        <path d="M8 1v4H4V1M4 7h4"/>
                      </svg>
                      Huidig ontwerp opslaan
                    </button>
                  )}
                  <SavedDesignsPanel
                    designs={savedDesigns}
                    events={events}
                    renamingDesign={renamingDesign}
                    loadedDesignId={loadedDesignId}
                    onLoad={handleLoadDesign}
                    onDelete={handleDeleteDesign}
                    onRename={handleRenameDesign}
                    onStartRename={setRenamingDesign}
                    onDuplicate={handleDuplicateDesign}
                  />
                </div>
              )}
              {leftPanel === 'formats' && (
                <GridTypeSelector
                  selected={selectedFormat}
                  onSelect={handleSelectFormat}
                  formats={customFormats.length > 0 ? customFormats : (staticImported ? [] : allStaticFormats)}
                />
              )}
              {leftPanel === 'adjust' && format && (
                <>
                  <GridToolbar format={format} onChange={handleFormatChange} cellPresets={cellPresets} canvasPresets={canvasPresets} backgroundPresets={backgroundPresets} layout="vertical" />
                  <div className="bg-white rounded-xl border border-gray-200 p-4 flex-shrink-0">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Info</h2>
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
              {leftPanel === 'frequency' && (
                <FrequencyPanel slots={slots} onBulkReplace={handleBulkReplace} sponsors={sponsors} />
              )}
            </div>
          </motion.div>
          </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Center + right — with padding */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0 min-w-0">

        {/* Center — toolbar + grid/preview */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">

          {format && (
            <div className="flex-shrink-0 flex items-center gap-2 w-full">
              {/* View toggle */}
              <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
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
              {/* Auto-advance direction */}
              <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center justify-center" title="Auto-advance richting">
                <div className="grid grid-cols-3 gap-[1px]">
                  {DIR_GRID.map((row) => row.map(dir => (
                    <button
                      key={dir}
                      onClick={() => setAdvanceDir(dir)}
                      title={dir === 'none' ? 'Geen vooruitgang' : `Richting: ${dir}`}
                      className={`w-2 h-2 flex items-center justify-center rounded-sm text-[7px] transition-colors leading-none
                        ${advanceDir === dir
                          ? 'bg-blue-600 text-white'
                          : dir === 'none'
                            ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    >{DIR_ARROWS[dir]}</button>
                  )))}
                </div>
              </div>
              {/* Ruler toggle — only relevant in preview */}
              {view === 'preview' && (
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setShowRuler(v => !v)}
                    title={showRuler ? 'Liniaal verbergen' : 'Liniaal tonen'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      showRuler ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="3.5" width="10" height="5" rx="1"/>
                      <line x1="3" y1="3.5" x2="3" y2="5.5"/>
                      <line x1="5" y1="3.5" x2="5" y2="4.5"/>
                      <line x1="7" y1="3.5" x2="7" y2="5.5"/>
                      <line x1="9" y1="3.5" x2="9" y2="4.5"/>
                    </svg>
                    Liniaal
                  </button>
                </div>
              )}
              {/* Silhouette 3-way toggle: Off / Persoon / Stoel — only in preview */}
              {view === 'preview' && (
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setActiveOverlay(null)}
                    title="Geen silhouet"
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      activeOverlay === null ? 'bg-gray-200 text-gray-500' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/>
                      <line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveOverlay('person')}
                    title="Referentiepersoon (180 cm)"
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      activeOverlay === 'person' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <circle cx="7" cy="3" r="2.2"/>
                      <path d="M3.5 6.5C3.5 5.7 5.1 5 7 5s3.5.7 3.5 1.5V9H9.5v4h-5V9H3.5V6.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveOverlay('chair')}
                    title="Referentiestoel"
                    className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      activeOverlay === 'chair' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <rect x="3" y="2" width="8" height="5" rx="1"/>
                      <rect x="2" y="7" width="10" height="1.5" rx="0.5"/>
                      <rect x="3" y="8.5" width="1.5" height="3.5" rx="0.5"/>
                      <rect x="9.5" y="8.5" width="1.5" height="3.5" rx="0.5"/>
                    </svg>
                  </button>
                </div>
              )}
              {/* Actions */}
              <div className="ml-auto bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                {loadedDesignId && isDirty && (
                  <button
                    onClick={handleUpdateDesign}
                    title="Bestaand ontwerp overschrijven"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                      <path d="M8 1v4H4V1M4 7h4"/>
                    </svg>
                    Bijwerken
                  </button>
                )}
                <button
                  onClick={handleClearGrid}
                  title="Grid wissen"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-500 hover:bg-red-50 hover:text-red-500"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h8M5 3V2h2v1M4 3l.5 7h3L8 3"/>
                  </svg>
                  Wissen
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!format ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" strokeWidth="2" className="text-gray-300" stroke="currentColor">
                      <rect x="2" y="2" width="10" height="10" rx="2"/>
                      <rect x="16" y="2" width="10" height="10" rx="2"/>
                      <rect x="2" y="16" width="10" height="10" rx="2"/>
                      <rect x="16" y="16" width="10" height="10" rx="2"/>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Kies een backdrop-formaat</p>
                  {leftPanel === 'formats' ? (
                    <p className="mt-2 text-xs text-gray-400">← Selecteer een formaat uit de lijst</p>
                  ) : (
                    <button
                      onClick={() => setLeftPanel('formats')}
                      className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                    >
                      Formaten bekijken →
                    </button>
                  )}
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
                  onSweepSlot={handleSweepSlot}
                  onDropSponsor={handleDropOnSlot}
                />
              </div>
            ) : (
              <PreviewCanvas
                format={format}
                slots={slots}
                selectedSlots={selectedSlots}
                onSelectSlot={handleSelectSlot}
                onSweepSlot={handleSweepSlot}
                onClearSelection={() => setSelectedSlots(new Set())}
                onDropSponsor={handleDropOnSlot}
                customLogos={customLogos}
                showRuler={showRuler}
                activeOverlay={activeOverlay}
                onOverlayChange={setActiveOverlay}
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
            tags={tags}
            sponsorCategories={sponsorCategories}
            events={events}
            categoryList={categoryList}
            eventGroups={eventGroups}
            sponsorGroups={sponsorGroups}
            customSponsors={customSponsors}
          />
        </div>

        </div> {/* end center+right wrapper */}
      </div>

      {showSaveModal && (
        <SaveModal
          events={events}
          defaults={saveModalDefaults}
          onConfirm={handleSaveDesign}
          onCancel={() => { setShowSaveModal(false); setSaveModalDefaults(null) }}
        />
      )}


    </div>
  )
}
