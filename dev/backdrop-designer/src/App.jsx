import { useState, useEffect, useRef, useMemo } from 'react'
import './index.css'
import allStaticFormats from './data/backdropFormats.json'
import GridTypeSelector from './components/GridTypeSelector'
import GridCanvas from './components/GridCanvas'
import FrequencyPanel from './components/FrequencyPanel'
import FormatPickerModal from './components/FormatPickerModal'
import LogoLibrary from './components/LogoLibrary'
import SettingsModal from './components/SettingsModal'
import GridToolbar from './components/GridToolbar'
import PreviewCanvas from './components/PreviewCanvas'
import { exportJpeg } from './utils/exportJpeg'
import {
  loadCustomLogos, saveCustomLogos, loadSavedDesigns, saveDesignsList,
  loadDesignFolders, saveDesignFolders,
  loadTags, saveTags, loadEvents, saveEvents,
  loadSponsorCategories, saveSponsorCategories,
  loadCategoryList, saveCategoryList,
  loadEventGroups, saveEventGroups,
  loadSponsorGroups, saveSponsorGroups,
  loadCellPresets, saveCellPresets,
  loadCanvasPresets, saveCanvasPresets,
  loadDefaultAspect, saveDefaultAspect,
  loadCustomFormats, saveCustomFormats,
  loadStaticImported, saveStaticImported,
  loadCustomSponsors, saveCustomSponsors,
  saveDraft, loadDraft, clearDraft,
} from './utils/sponsorTags'

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


function DesignRow({ d, renamingDesign, isLoaded, onLoad, onDelete, onRename, onStartRename, onDuplicate }) {
  const inputRef = { current: null }
  return (
    <div className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ml-2 ${isLoaded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      {renamingDesign === d.id ? (
        <div className="flex items-center gap-1 flex-1">
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
        <>
          <button onClick={() => onLoad(d)} className="flex-1 text-left min-w-0">
            <p className={`text-xs font-medium truncate ${isLoaded ? 'text-blue-700' : 'text-gray-800'}`}>{d.name}</p>
            <p className="text-[10px] text-gray-400">{d.formatCode}{d.formatCode ? ' · ' : ''}{new Date(d.savedAt).toLocaleDateString('nl-BE')}</p>
          </button>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={e => { e.stopPropagation(); onDuplicate(d) }} title="Dupliceren"
              className="p-1 text-gray-300 hover:text-blue-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="7" height="7" rx="1"/><path d="M1 8V2a1 1 0 011-1h6"/>
              </svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onStartRename(d.id) }} title="Hernoemen"
              className="p-1 text-gray-300 hover:text-gray-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1l3 3-7 7H1V8l7-7z"/></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(d.id) }} title="Verwijderen"
              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/></svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SaveModal({ events, defaults, onConfirm, onCancel }) {
  var currentYear = new Date().getFullYear()
  var [event, setEvent] = useState(defaults && defaults.event ? defaults.event : '')
  var [edition, setEdition] = useState(defaults && defaults.edition ? defaults.edition : currentYear)
  var [name, setName] = useState(defaults && defaults.name ? defaults.name : '')

  function handleConfirm() {
    if (!name.trim()) return
    onConfirm({ event: event || null, edition: edition || null, name: name.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Ontwerp opslaan</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event</label>
            <select value={event} onChange={e => setEvent(e.target.value)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
              <option value="">Geen event</option>
              {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Editie (jaar)</label>
            <input type="number" value={edition}
              onChange={e => setEdition(parseInt(e.target.value, 10) || currentYear)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              min={2000} max={2100}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Naam *</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onCancel() }}
              placeholder="Bijv. Startpodium — Variant A"
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onCancel}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button onClick={handleConfirm} disabled={!name.trim()}
            className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

function SavedDesignsPanel({ designs, events, renamingDesign, loadedDesignId, onLoad, onDelete, onRename, onStartRename, onDuplicate }) {
  var [query, setQuery] = useState('')
  var [collapsedEvents, setCollapsedEvents] = useState({})
  var [collapsedEditions, setCollapsedEditions] = useState({})

  var filtered = useMemo(function() {
    if (!query.trim()) return designs
    var q = query.toLowerCase()
    return designs.filter(function(d) {
      return (d.name || '').toLowerCase().includes(q) ||
        (d.event || '').toLowerCase().includes(q) ||
        String(d.edition || '').includes(q)
    })
  }, [designs, query])

  var grouped = useMemo(function() {
    var eventMap = {}
    var noEvent = []
    filtered.forEach(function(d) {
      if (!d.event) { noEvent.push(d); return }
      if (!eventMap[d.event]) eventMap[d.event] = {}
      var year = d.edition !== null && d.edition !== undefined ? String(d.edition) : '__none__'
      if (!eventMap[d.event][year]) eventMap[d.event][year] = []
      eventMap[d.event][year].push(d)
    })
    var eventOrder = {}
    events.forEach(function(ev, i) { eventOrder[ev] = i })
    var sortedEventKeys = Object.keys(eventMap).sort(function(a, b) {
      var ai = eventOrder[a] !== undefined ? eventOrder[a] : 999
      var bi = eventOrder[b] !== undefined ? eventOrder[b] : 999
      if (ai !== bi) return ai - bi
      return a.localeCompare(b)
    })
    var result = sortedEventKeys.map(function(ev) {
      return {
        event: ev,
        editions: Object.keys(eventMap[ev]).sort(function(a, b) {
          if (a === '__none__') return 1
          if (b === '__none__') return -1
          return parseInt(b, 10) - parseInt(a, 10)
        }).map(function(year) {
          return {
            year: year === '__none__' ? null : year,
            designs: eventMap[ev][year].slice().sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0) })
          }
        })
      }
    })
    if (noEvent.length > 0) {
      result.push({
        event: null,
        editions: [{ year: null, designs: noEvent.slice().sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0) }) }]
      })
    }
    return result
  }, [filtered, events])

  function toggleEvent(evKey) {
    setCollapsedEvents(function(prev) { var n = Object.assign({}, prev); n[evKey] = !n[evKey]; return n })
  }
  function toggleEdition(evKey, yearKey) {
    var k = evKey + '__' + yearKey
    setCollapsedEditions(function(prev) { var n = Object.assign({}, prev); n[k] = !n[k]; return n })
  }
  function isEventCollapsed(evKey) { return !!collapsedEvents[evKey] }
  function isEditionCollapsed(evKey, yearKey) { return !!collapsedEditions[evKey + '__' + yearKey] }

  if (designs.length === 0 && !query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <path d="M6 3h14l6 6v20a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"/>
          <path d="M20 3v8h8M12 17h8M12 22h5"/>
        </svg>
        <p className="text-xs text-gray-400">Nog geen opgeslagen ontwerpen.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-2 flex-shrink-0">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Zoek ontwerp..."
          className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {grouped.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 italic">Geen resultaten.</p>
        )}
        {grouped.map(function(group) {
          var evKey = group.event || '__none__'
          var totalCount = group.editions.reduce(function(n, e) { return n + e.designs.length }, 0)
          return (
            <div key={evKey} className="mb-1">
              <button onClick={() => toggleEvent(evKey)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ transform: isEventCollapsed(evKey) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                  <path d="M2 3.5l3 3 3-3"/>
                </svg>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide truncate flex-1">
                  {group.event || 'Overig'}
                </span>
                {!group.event && (
                  <span className="text-[9px] text-gray-300 mr-1 flex-shrink-0" title="Sla op met een event en editie om te groeperen">zonder event</span>
                )}
                <span className="text-[10px] text-gray-400 flex-shrink-0">({totalCount})</span>
              </button>
              {!isEventCollapsed(evKey) && group.editions.map(function(editionGroup) {
                var yearKey = editionGroup.year !== null ? String(editionGroup.year) : '__none__'
                var showEditionHeader = editionGroup.year !== null || group.editions.length > 1
                return (
                  <div key={yearKey} className="ml-3">
                    {showEditionHeader && (
                      <button onClick={() => toggleEdition(evKey, yearKey)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-gray-50 rounded transition-colors">
                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          style={{ transform: isEditionCollapsed(evKey, yearKey) ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <path d="M2 3.5l3 3 3-3"/>
                        </svg>
                        <span className="text-[11px] font-semibold text-gray-500">{editionGroup.year || 'Geen editie'}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">({editionGroup.designs.length})</span>
                      </button>
                    )}
                    {!isEditionCollapsed(evKey, yearKey) && editionGroup.designs.map(function(d) {
                      return (
                        <DesignRow key={d.id} d={d} renamingDesign={renamingDesign} isLoaded={loadedDesignId === d.id}
                          onLoad={onLoad} onDelete={onDelete} onRename={onRename}
                          onStartRename={onStartRename} onDuplicate={onDuplicate}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ─── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  const styles = {
    success: { bg: '#16a34a', icon: <path d="M2 7l4 4 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    info:    { bg: '#2563eb', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    warning: { bg: '#d97706', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    error:   { bg: '#dc2626', icon: <path d="M3 3l8 8M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
  }
  const s = styles[type] || styles.success

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 400,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 10,
      background: s.bg,
      color: 'white', fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
      pointerEvents: 'none',
      animation: 'toastIn 0.18s ease',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{s.icon}</svg>
      {message}
    </div>
  )
}

// ─── Export dropdown ─────────────────────────────────────────────────────────
function ExportMenu({ format, slots, customLogos, onImportJson }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const importRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleJpeg() {
    exportJpeg(format, slots, customLogos)
    setOpen(false)
  }

  function handleJson() {
    var data = { version: 1, format: format, slots: slots, exportedAt: Date.now() }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (format.Code || 'ontwerp') + '_design.json'
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function handleImportClick() {
    setOpen(false)
    if (importRef.current) importRef.current.click()
  }

  function handleImportFile(e) {
    var file = e.target.files[0]
    if (!file) return
    var reader = new FileReader()
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result)
        if (!data.format || !Array.isArray(data.slots)) throw new Error('Ongeldig formaat')
        onImportJson(data)
      } catch (err) {
        alert('Kon het bestand niet laden: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCsv() {
    const { Cols, Rows, Code } = format
    function csvCell(val) {
      var s = (val && val !== '') ? val : 'BLANK'
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    var colHeaders = Array.from({ length: Cols }, function(_, i) { return 'C' + (i + 1) })
    var lines = [colHeaders.join(',')]
    for (var r = 0; r < Rows; r++) {
      var row = []
      for (var c = 0; c < Cols; c++) row.push(csvCell(slots[r * Cols + c]))
      lines.push(row.join(','))
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = (Code || 'grid') + '_grid.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Exporteren"
        className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold text-sm px-3 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 1v8M4 6l3 3 3-3M2 11h10"/>
        </svg>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50, minWidth: 160 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl py-1">
          <button onClick={handleJpeg}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="1" y="1" width="12" height="12" rx="2"/>
              <path d="M1 9l3-3 2 2 3-4 4 5"/>
            </svg>
            <span className="font-medium">JPEG</span>
            <span className="ml-auto text-xs text-gray-400">beeld</span>
          </button>
          <button onClick={handleCsv}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3M4 8h6M4 11h4"/>
            </svg>
            <span className="font-medium">CSV</span>
            <span className="ml-auto text-xs text-gray-400">Gridzilla</span>
          </button>
          <button onClick={handleJson}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
              <path d="M9 1v3h3"/>
              <path d="M4 7.5c0-1 1.5-1 1.5 0s-1.5 1-1.5 2 1.5 1 1.5 0M8 7h1.5a1 1 0 010 2H8"/>
            </svg>
            <span className="font-medium">JSON</span>
            <span className="ml-auto text-xs text-gray-400">backup</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={handleImportClick}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 10V2M4 5l3-3 3 3M2 11h10"/>
            </svg>
            <span className="font-medium">JSON laden</span>
            <span className="ml-auto text-xs text-gray-400">importeer</span>
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
        </div>
      )}
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, confirmLabel = 'Verwijderen', variant = 'danger', onConfirm, onCancel }) {
  const btnClass = variant === 'warning'
    ? 'bg-orange-500 hover:bg-orange-600 text-white'
    : 'bg-red-600 hover:bg-red-700 text-white'
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-gray-700 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
            Annuleren
          </button>
          <button onClick={() => { onConfirm(); onCancel() }}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${btnClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [editedFormat, setEditedFormat] = useState(null)
  const [slots, setSlots] = useState([])
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [editingFormat, setEditingFormat] = useState(null)
  const [staticImported, setStaticImported] = useState(() => loadStaticImported())
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [view, setView] = useState('grid') // 'grid' | 'preview'
  const [customLogos, setCustomLogos] = useState(() => loadCustomLogos())
  const [savedDesigns, setSavedDesigns] = useState(() => loadSavedDesigns())
  const [designFolders, setDesignFolders] = useState(() => loadDesignFolders())
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveModalDefaults, setSaveModalDefaults] = useState(null)
  const [renamingDesign, setRenamingDesign] = useState(null)
  const [advanceDir, setAdvanceDirState] = useState(() => localStorage.getItem('backdropDesigner_advanceDir') || 'r')

  // Settings state (lifted from LogoLibrary)
  const [tags, setTags] = useState(() => loadTags())
  const [sponsorCategories, setSponsorCategories] = useState(() => loadSponsorCategories())
  const [events, setEvents] = useState(() => loadEvents())
  const [categoryList, setCategoryList] = useState(() => loadCategoryList())
  const [eventGroups, setEventGroups] = useState(() => loadEventGroups())
  const [sponsorGroups, setSponsorGroups] = useState(() => loadSponsorGroups())
  const [cellPresets, setCellPresets] = useState(() => loadCellPresets())
  const [canvasPresets, setCanvasPresets] = useState(() => loadCanvasPresets())
  const [customFormats, setCustomFormats] = useState(() => loadCustomFormats())
  const [customSponsors, setCustomSponsors] = useState(() => loadCustomSponsors())
  const [defaultAspect, setDefaultAspectState] = useState(() => loadDefaultAspect())
  const [showSettings, setShowSettings] = useState(false)
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

  function handleCustomLogoChange(sponsorName, dataUrl) {
    const next = { ...customLogos }
    if (dataUrl) next[sponsorName] = dataUrl
    else delete next[sponsorName]
    setCustomLogos(next)
    saveCustomLogos(next)
  }

  function handleAddCustomSponsor({ partner, dataUrl, eventSelections, groupSelections }) {
    const id = Date.now().toString()
    const next = [...customSponsors, { id, partner, dataUrl }]
    setCustomSponsors(next)
    saveCustomSponsors(next)
    // eventSelections: { [eventCode]: categoryString }
    if (eventSelections && Object.keys(eventSelections).length > 0) {
      handleTagsChange(partner, Object.keys(eventSelections))
      Object.entries(eventSelections).forEach(([ev, cat]) => {
        if (cat) handleCategoryChange(partner, ev, cat)
      })
    }
    // groupSelections: { [groupName]: categoryString }
    if (groupSelections && Object.keys(groupSelections).length > 0) {
      handleSponsorGroupsChange(partner, groupSelections)
    }
  }

  function handleDeleteCustomSponsor(partner) {
    const next = customSponsors.filter(s => s.partner !== partner)
    setCustomSponsors(next)
    saveCustomSponsors(next)
  }

  function handleSaveDesign({ event, edition, name }) {
    const design = {
      id: Date.now(),
      name: name || `${editedFormat?.Code || 'Ontwerp'} — ${new Date().toLocaleDateString('nl-BE')}`,
      event: event || null,
      edition: edition || null,
      formatCode: editedFormat?.Code || '',
      format: { ...editedFormat },
      slots: [...slots],
      savedAt: Date.now(),
      folder: null,
    }
    const next = [design, ...savedDesigns]
    setSavedDesigns(next)
    saveDesignsList(next)
    setShowSaveModal(false)
    setSaveModalDefaults(null)
    clearDraft()
    setIsDirty(false)
    showToast('Ontwerp opgeslagen', 'success')
  }

  function handleDuplicateDesign(design) {
    const copy = {
      ...design,
      id: Date.now(),
      name: design.name + ' (kopie)',
      savedAt: Date.now(),
      slots: [...design.slots],
      format: { ...design.format },
    }
    const next = [copy, ...savedDesigns]
    setSavedDesigns(next)
    saveDesignsList(next)
    showToast('"' + copy.name + '" aangemaakt', 'success')
  }

  function handleUpdateDesign() {
    if (!loadedDesignId) return
    const next = savedDesigns.map(d =>
      d.id === loadedDesignId
        ? { ...d, format: { ...editedFormat }, slots: [...slots], savedAt: Date.now() }
        : d
    )
    setSavedDesigns(next)
    saveDesignsList(next)
    clearDraft()
    setIsDirty(false)
    const design = next.find(d => d.id === loadedDesignId)
    showToast(`"${design?.name || 'Ontwerp'}" bijgewerkt`, 'success')
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
    askConfirm(`Ontwerp ${name} definitief verwijderen?`, () => {
      const next = savedDesigns.filter(d => d.id !== id)
      setSavedDesigns(next)
      saveDesignsList(next)
      if (loadedDesignId === id) setLoadedDesignId(null)
      showToast('Ontwerp verwijderd', 'info')
    })
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

  function handleCustomFormat(format) {
    setShowCustomModal(false)
    handleSelectFormat(format)
  }

  function handleSaveCustomFormat(format, editingId) {
    const withMeta = { ...format, _custom: true, id: editingId || `custom_${Date.now()}` }
    setCustomFormats(prev => {
      const updated = editingId
        ? prev.map(f => (f.id === editingId || f.Code === editingId) ? withMeta : f)
        : [...prev, withMeta]
      saveCustomFormats(updated)
      return updated
    })
  }

  function handleImportAllFormats() {
    const existingCodes = new Set(customFormats.map(f => f.Code))
    const toImport = allStaticFormats
      .filter(f => !existingCodes.has(f.Code))
      .map(f => ({ ...f, _custom: true, id: f.Code }))
    setCustomFormats(prev => {
      const updated = [...prev, ...toImport]
      saveCustomFormats(updated)
      return updated
    })
    setStaticImported(true)
    saveStaticImported(true)
  }

  function handleDeleteCustomFormat(format) {
    setCustomFormats(prev => {
      const updated = prev.filter(f => f.id !== format.id && f.Code !== format.Code)
      saveCustomFormats(updated)
      return updated
    })
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

  // ─── Tags & categories (for SponsorEditModal in LogoLibrary) ─────────────
  function handleTagsChange(sponsorName, eventsArray) {
    const newTags = { ...tags, [sponsorName]: eventsArray }
    setTags(newTags); saveTags(newTags)
  }

  function handleCategoryChange(sponsorName, event, category) {
    const catCopy = { ...sponsorCategories, [sponsorName]: { ...(sponsorCategories[sponsorName] || {}), [event]: category } }
    if (category === '') delete catCopy[sponsorName][event]
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  function handleSponsorGroupsChange(sponsorName, groupData) {
    const next = { ...sponsorGroups, [sponsorName]: groupData }
    setSponsorGroups(next); saveSponsorGroups(next)
  }

  // ─── Events ──────────────────────────────────────────────────────────────
  function addEvent(val) {
    const v = val.trim().toUpperCase()
    if (!v || events.includes(v)) return
    const next = [...events, v]; setEvents(next); saveEvents(next)
  }

  function deleteEvent(ev) {
    askConfirm(`Event "${ev}" verwijderen? Alle sponsortags voor dit event gaan verloren.`, () => {
      const next = events.filter(e => e !== ev); setEvents(next); saveEvents(next)
      const newTags = {}
      Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.filter(e => e !== ev) })
      setTags(newTags); saveTags(newTags)
      const catCopy = {}
      Object.entries(sponsorCategories).forEach(([name, evMap]) => {
        catCopy[name] = { ...evMap }; delete catCopy[name][ev]
      })
      setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    })
  }

  function renameEvent(oldName, newName) {
    const val = newName.trim().toUpperCase()
    if (!val || val === oldName || events.includes(val)) return
    const next = events.map(e => e === oldName ? val : e); setEvents(next); saveEvents(next)
    const newTags = {}
    Object.entries(tags).forEach(([name, evs]) => { newTags[name] = evs.map(e => e === oldName ? val : e) })
    setTags(newTags); saveTags(newTags)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, cat]) => { catCopy[name][ev === oldName ? val : ev] = cat })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  // ─── Categories ──────────────────────────────────────────────────────────
  function addCategory(val) {
    if (!val || categoryList.includes(val)) return
    const next = [...categoryList, val]; setCategoryList(next); saveCategoryList(next)
  }

  function deleteCategory(cat) {
    askConfirm(`Categorie "${cat}" verwijderen? Alle sponsortoewijzingen voor deze categorie gaan verloren.`, () => {
      const next = categoryList.filter(c => c !== cat); setCategoryList(next); saveCategoryList(next)
      const catCopy = {}
      Object.entries(sponsorCategories).forEach(([name, evMap]) => {
        catCopy[name] = {}
        Object.entries(evMap).forEach(([ev, c]) => { if (c !== cat) catCopy[name][ev] = c })
      })
      setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
    })
  }

  function renameCategory(oldCat, newCat) {
    const val = newCat.trim()
    if (!val || val === oldCat || categoryList.includes(val)) return
    const next = categoryList.map(c => c === oldCat ? val : c); setCategoryList(next); saveCategoryList(next)
    const catCopy = {}
    Object.entries(sponsorCategories).forEach(([name, evMap]) => {
      catCopy[name] = {}
      Object.entries(evMap).forEach(([ev, c]) => { catCopy[name][ev] = c === oldCat ? val : c })
    })
    setSponsorCategories(catCopy); saveSponsorCategories(catCopy)
  }

  function reorderCategoryList(newOrder) {
    setCategoryList(newOrder); saveCategoryList(newOrder)
  }

  // ─── Event groups (koepels) ───────────────────────────────────────────────
  function addEventGroup(name) {
    const v = name.trim()
    if (!v || v in eventGroups) return
    const next = { ...eventGroups, [v]: [] }; setEventGroups(next); saveEventGroups(next)
  }

  function deleteEventGroup(name) {
    askConfirm(`Koepel "${name}" verwijderen?`, () => {
      const next = { ...eventGroups }; delete next[name]
      setEventGroups(next); saveEventGroups(next)
      const sg = {}
      Object.entries(sponsorGroups).forEach(([sp, groups]) => { const g = { ...groups }; delete g[name]; sg[sp] = g })
      setSponsorGroups(sg); saveSponsorGroups(sg)
    })
  }

  function renameEventGroup(oldName, newName) {
    const val = newName.trim()
    if (!val || val === oldName || val in eventGroups) return
    const next = {}
    Object.entries(eventGroups).forEach(([k, v]) => { next[k === oldName ? val : k] = v })
    setEventGroups(next); saveEventGroups(next)
    const sg = {}
    Object.entries(sponsorGroups).forEach(([sp, groups]) => {
      const g = {}
      Object.entries(groups).forEach(([k, v]) => { g[k === oldName ? val : k] = v })
      sg[sp] = g
    })
    setSponsorGroups(sg); saveSponsorGroups(sg)
  }

  function setEventKoepelAssign(eventCode, koepelName) {
    const next = {}
    Object.entries(eventGroups).forEach(([grp, evs]) => { next[grp] = evs.filter(e => e !== eventCode) })
    if (koepelName && koepelName in next) next[koepelName] = [...next[koepelName], eventCode]
    setEventGroups(next); saveEventGroups(next)
  }

  // ─── Cell presets ─────────────────────────────────────────────────────────
  function handleCellPresetsChange(newPresets) {
    setCellPresets(newPresets); saveCellPresets(newPresets)
  }

  // ─── Canvas presets ───────────────────────────────────────────────────────
  function handleCanvasPresetsChange(newPresets) {
    setCanvasPresets(newPresets); saveCanvasPresets(newPresets)
  }

  // ─── Default aspect ratio ─────────────────────────────────────────────────
  function handleDefaultAspectChange(val) {
    const v = parseFloat(val) || 1.667
    setDefaultAspectState(v)
    saveDefaultAspect(v)
    // Apply immediately to the currently loaded format
    if (editedFormat) {
      const newH = Math.round((editedFormat.CellW_mm || 0) / v * 1000) / 1000
      handleFormatChange({ ...editedFormat, CellAspect: v, CellH_mm: newH })
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
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

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
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-amber-400 flex-shrink-0">
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
            className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold transition-colors flex-shrink-0">
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
            <div className="flex items-center gap-1.5">
              {loadedDesignId && isDirty && (
                <button
                  onClick={handleUpdateDesign}
                  title="Bestaand ontwerp overschrijven"
                  className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 font-semibold transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 1h7l2 2v8a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                    <path d="M8 1v4H4V1M4 7h4"/>
                  </svg>
                  Bijwerken
                </button>
              )}
            </div>
            <button
              onClick={handleClearGrid}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors px-1"
              title="Grid wissen"
            >
              Wissen
            </button>
            <ExportMenu format={format} slots={slots} customLogos={customLogos} onImportJson={handleImportJson} />
          </div>
        )}
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
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {icon}
            </button>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings — bottom */}
          <button
            title="Instellingen"
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="9" cy="9" r="3"/>
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"/>
            </svg>
          </button>
        </div>

        {/* ── Side panel — conditional ── */}
        {leftPanel && (
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
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
                  staticFormats={staticImported ? [] : allStaticFormats}
                  customFormats={customFormats}
                  onDeleteCustomFormat={handleDeleteCustomFormat}
                  onCustom={() => setShowCustomModal(true)}
                  onEdit={f => setEditingFormat(f)}
                />
              )}
              {leftPanel === 'adjust' && format && (
                <>
                  <GridToolbar format={format} onChange={handleFormatChange} cellPresets={cellPresets} canvasPresets={canvasPresets} layout="vertical" />
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
                <FrequencyPanel slots={slots} onBulkReplace={handleBulkReplace} />
              )}
            </div>
          </div>
        )}

        {/* Center + right — with padding */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0 min-w-0">

        {/* Center — toolbar + grid/preview */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">

          {format && (
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-1 flex gap-1 self-start">
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
            onOpenSettings={() => setShowSettings(true)}
            tags={tags}
            sponsorCategories={sponsorCategories}
            events={events}
            categoryList={categoryList}
            eventGroups={eventGroups}
            sponsorGroups={sponsorGroups}
            onTagsChange={handleTagsChange}
            onCategoryChange={handleCategoryChange}
            onSponsorGroupsChange={handleSponsorGroupsChange}
            customSponsors={customSponsors}
            onAddCustomSponsor={handleAddCustomSponsor}
            onDeleteCustomSponsor={handleDeleteCustomSponsor}
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

      {(showCustomModal || editingFormat) && (
        <FormatPickerModal
          staticFormats={staticImported ? [] : allStaticFormats}
          customFormats={customFormats}
          initialFormat={editingFormat || null}
          editMode={!!editingFormat}
          onConfirm={format => { setShowCustomModal(false); setEditingFormat(null); handleSelectFormat(format) }}
          onSaveCustom={handleSaveCustomFormat}
          onDeleteCustom={handleDeleteCustomFormat}
          onClose={() => { setShowCustomModal(false); setEditingFormat(null) }}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          cellPresets={cellPresets}
          onCellPresetsChange={handleCellPresetsChange}
          canvasPresets={canvasPresets}
          onCanvasPresetsChange={handleCanvasPresetsChange}
          defaultAspect={defaultAspect}
          onDefaultAspectChange={handleDefaultAspectChange}
          events={events}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
          onRenameEvent={renameEvent}
          eventGroups={eventGroups}
          onAddEventGroup={addEventGroup}
          onDeleteEventGroup={deleteEventGroup}
          onRenameEventGroup={renameEventGroup}
          onSetEventKoepel={setEventKoepelAssign}
          categoryList={categoryList}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          onRenameCategory={renameCategory}
          onReorderCategoryList={reorderCategoryList}
        />
      )}
    </div>
  )
}
