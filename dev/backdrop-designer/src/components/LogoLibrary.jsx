import { useState, useRef, useEffect, useMemo } from 'react'
import sponsors from '../data/sponsors.json'
import SponsorEditModal from './SponsorEditModal'

const BLANK = { partner: 'BLANK', filename: 'BLANK' }
const STATIC_SPONSORS = [BLANK, ...sponsors]

// Inline collapsible checklist with optional per-item category select
function CheckSection({ label, items, selections, onToggle, onCatChange, categoryList = [], color = 'blue' }) {
  const [open, setOpen] = useState(false)
  const checkedCount = Object.keys(selections).length
  const headerActive = color === 'teal'
    ? 'text-teal-700 bg-teal-50 border-teal-200'
    : 'text-blue-700 bg-blue-50 border-blue-200'
  const checkBg = color === 'teal' ? 'bg-teal-500' : 'bg-blue-500'

  if (items.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
          checkedCount > 0 ? headerActive : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span>{label}{checkedCount > 0 ? ` (${checkedCount})` : ''}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.map(item => {
            const isChecked = item in selections
            return (
              <div key={item} className={`flex items-center gap-2 px-3 py-1.5 ${isChecked ? 'bg-gray-50' : ''}`}>
                {/* Checkbox */}
                <button type="button" onClick={() => onToggle(item)}
                  className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    isChecked ? `${checkBg} border-transparent` : 'border-gray-300 hover:border-gray-400'
                  }`}>
                  {isChecked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1.5 4l2 2 3-3"/>
                    </svg>
                  )}
                </button>
                {/* Label — click also toggles */}
                <button type="button" onClick={() => onToggle(item)}
                  className="flex-1 text-left text-xs font-semibold text-gray-700 truncate">
                  {item}
                </button>
                {/* Category select — only when checked */}
                {isChecked && categoryList.length > 0 && (
                  <select
                    value={selections[item] || ''}
                    onChange={e => onCatChange(item, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 max-w-[110px]"
                  >
                    <option value="">— geen —</option>
                    {categoryList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddSponsorModal({ onConfirm, onCancel, events = [], eventGroups = {}, categoryList = [] }) {
  const [name, setName] = useState('')
  const [dataUrl, setDataUrl] = useState(null)
  const [preview, setPreview] = useState(null)
  const [draggingFile, setDraggingFile] = useState(false)
  // selections: { [item]: categoryString }
  const [groupSelections, setGroupSelections] = useState({})
  const [eventSelections, setEventSelections] = useState({})
  const fileInputRef = useRef(null)

  const groupNames = Object.keys(eventGroups)

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').toUpperCase()
    setName(prev => prev || baseName)
    const reader = new FileReader()
    reader.onload = e => { setDataUrl(e.target.result); setPreview(e.target.result) }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDraggingFile(false)
    handleFile(e.dataTransfer.files[0])
  }

  function toggleGroup(g) {
    setGroupSelections(prev => {
      const next = { ...prev }
      g in next ? delete next[g] : (next[g] = '')
      return next
    })
  }

  function toggleEvent(ev) {
    setEventSelections(prev => {
      const next = { ...prev }
      ev in next ? delete next[ev] : (next[ev] = '')
      return next
    })
  }

  const canConfirm = name.trim().length > 0 && dataUrl

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-80 flex flex-col" style={{ maxHeight: 'calc(100vh - 48px)' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-800">Sponsor toevoegen</h2>
          <p className="text-xs text-gray-400 mt-0.5">Upload een logo en geef een naam en events op.</p>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
          {/* Logo upload */}
          <div
            onDragOver={e => { e.preventDefault(); setDraggingFile(true) }}
            onDragLeave={() => setDraggingFile(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors h-24 ${
              draggingFile ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="h-16 object-contain" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                </svg>
                <span className="text-xs text-gray-400">Sleep een afbeelding hier of klik</span>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Naam</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())}
              placeholder="SPONSOR NAAM"
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
            />
          </div>
          {/* Koepels + Events */}
          {(groupNames.length > 0 || events.length > 0) && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Toewijzen aan</label>
              <CheckSection
                label="Koepels" items={groupNames}
                selections={groupSelections} onToggle={toggleGroup}
                onCatChange={(g, cat) => setGroupSelections(prev => ({ ...prev, [g]: cat }))}
                categoryList={categoryList} color="teal"
              />
              <CheckSection
                label="Events" items={events}
                selections={eventSelections} onToggle={toggleEvent}
                onCatChange={(ev, cat) => setEventSelections(prev => ({ ...prev, [ev]: cat }))}
                categoryList={categoryList} color="blue"
              />
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">Annuleren</button>
          <button
            onClick={() => canConfirm && onConfirm({ partner: name.trim(), dataUrl, eventSelections, groupSelections })}
            disabled={!canConfirm}
            className={`text-sm px-4 py-1.5 rounded-lg font-semibold transition-colors ${
              canConfirm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >Toevoegen</button>
        </div>
      </div>
    </div>
  )
}

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

export default function LogoLibrary({
  selectedSlots, onAssign, customLogos, onCustomLogoChange,
  advanceDir = 'r', onAdvanceDirChange,
  onOpenSettings,
  tags, sponsorCategories, events, categoryList, eventGroups, sponsorGroups,
  onTagsChange, onCategoryChange, onSponsorGroupsChange,
  customSponsors = [], onAddCustomSponsor, onDeleteCustomSponsor,
}) {
  const [query, setQuery] = useState('')
  const [imgErrors, setImgErrors] = useState({})
  const [dragging, setDragging] = useState(null)
  const [eventFilter, setEventFilter] = useState('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [editingSponsor, setEditingSponsor] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [toDelete, setToDelete] = useState(new Set())

  function toggleDeleteMode() {
    setDeleteMode(v => !v)
    setToDelete(new Set())
  }

  function toggleToDelete(partner) {
    setToDelete(prev => {
      const next = new Set(prev)
      next.has(partner) ? next.delete(partner) : next.add(partner)
      return next
    })
  }

  function confirmDelete() {
    toDelete.forEach(partner => onDeleteCustomSponsor && onDeleteCustomSponsor(partner))
    setToDelete(new Set())
    setDeleteMode(false)
  }

  // Merge static and custom sponsors; custom sponsors added at the end
  const allSponsors = useMemo(() => {
    const customEntries = customSponsors.map(s => ({ ...s, _custom: true }))
    return [...STATIC_SPONSORS, ...customEntries]
  }, [customSponsors])

  // Merged customLogos: combines uploaded overrides with dataUrls from customSponsors
  // so SponsorEditModal can show the preview for custom sponsors
  const mergedCustomLogos = useMemo(() => {
    const merged = { ...(customLogos || {}) }
    customSponsors.forEach(s => {
      if (s.dataUrl && !merged[s.partner]) merged[s.partner] = s.dataUrl
    })
    return merged
  }, [customLogos, customSponsors])

  function buildGroups(sponsorList) {
    const placed = new Set()
    const groups = []

    function getInfo(s) {
      const grpAssignments = sponsorGroups[s.partner] || {}
      for (const [groupName, cat] of Object.entries(grpAssignments)) {
        if ((eventGroups[groupName] || []).includes(eventFilter))
          return { tier: 'group', cat: cat || '' }
      }
      const evTags = tags[s.partner] || []
      if (evTags.includes(eventFilter)) {
        const cat = (sponsorCategories[s.partner] || {})[eventFilter] || ''
        return { tier: 'event', cat }
      }
      return { tier: 'untagged', cat: '' }
    }

    for (const cat of categoryList) {
      const matching = sponsorList.filter(s => {
        if (placed.has(s.partner)) return false
        const info = getInfo(s)
        return (info.tier === 'group' || info.tier === 'event') && info.cat === cat
      })
      if (matching.length) { groups.push({ key: cat, label: cat, color: 'blue', sponsors: matching }); matching.forEach(s => placed.add(s.partner)) }
    }

    const uncategorized = sponsorList.filter(s => {
      if (placed.has(s.partner)) return false
      const info = getInfo(s)
      return info.tier === 'group' || info.tier === 'event'
    })
    if (uncategorized.length) { groups.push({ key: '__none__', label: 'Zonder categorie', color: 'gray', sponsors: uncategorized }) }

    return groups
  }

  const searchActive = query.length > 0

  const filtered = useMemo(() => allSponsors.filter(s => {
    if (!s.partner.toLowerCase().includes(query.toLowerCase())) return false
    if (searchActive || eventFilter === 'ALL') return true
    const evTags = tags[s.partner] || []
    const grpAssignments = sponsorGroups[s.partner] || {}
    if (evTags.includes(eventFilter)) return true
    return Object.keys(grpAssignments).some(groupName =>
      (eventGroups[groupName] || []).includes(eventFilter)
    )
  }), [query, searchActive, eventFilter, tags, sponsorGroups, eventGroups, allSponsors])

  const groups = useMemo(
    () => (eventFilter !== 'ALL' && !searchActive) ? buildGroups(filtered) : [],
    [filtered, eventFilter, searchActive, sponsorGroups, eventGroups, tags, sponsorCategories, categoryList]
  )

  const hasSlot = selectedSlots.size > 0
  const count = selectedSlots.size

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    function handle(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [filterOpen])

  function handleDragStart(e, sponsorName) {
    e.dataTransfer.setData('sponsor', sponsorName)
    e.dataTransfer.effectAllowed = 'copy'
    setDragging(sponsorName)
  }
  function handleDragEnd() { setDragging(null) }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Logo's</h2>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setShowAddModal(true); setDeleteMode(false) }}
              title="Sponsor toevoegen"
              className="p-1 rounded transition-colors text-gray-400 hover:text-blue-500"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7 2v10M2 7h10"/>
              </svg>
            </button>
            {customSponsors.length > 0 && (
              <button
                onClick={toggleDeleteMode}
                title={deleteMode ? 'Annuleren' : 'Sponsors verwijderen'}
                className={`p-1 rounded transition-colors ${deleteMode ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400'}`}
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        {deleteMode && (
          <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-red-50 rounded-lg border border-red-100">
            <span className="text-xs text-red-600 font-medium">
              {toDelete.size === 0 ? 'Selecteer te verwijderen logos' : `${toDelete.size} geselecteerd`}
            </span>
            <button
              onClick={confirmDelete}
              disabled={toDelete.size === 0}
              className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                toDelete.size > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'text-red-300 cursor-not-allowed'
              }`}
            >Verwijderen</button>
          </div>
        )}

        <div className="relative">
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Zoek sponsor..."
            className="w-full text-sm px-3 py-1.5 pr-7 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l8 8M10 2L2 10"/>
              </svg>
            </button>
          )}
        </div>
        {searchActive && eventFilter !== 'ALL' && (
          <p className="text-[10px] text-amber-600 mt-1 px-0.5">Zoekt in alle sponsors — eventfilter tijdelijk genegeerd</p>
        )}

        <div className="relative mt-2" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors w-full ${eventFilter !== 'ALL' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'}`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h10M3 6h6M5 9h2"/>
            </svg>
            <span className="flex-1 text-left">{eventFilter === 'ALL' ? 'Alle events' : eventFilter}</span>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 3.5l3 3 3-3"/>
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 overflow-y-auto max-h-48">
              <button
                onClick={() => { setEventFilter('ALL'); setFilterOpen(false) }}
                className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${eventFilter === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >Alle events</button>
              {events.map(ev => (
                <button key={ev}
                  onClick={() => { setEventFilter(ev); setFilterOpen(false) }}
                  className={`w-full text-left text-xs px-3 py-1.5 font-semibold transition-colors ${eventFilter === ev ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'}`}
                >{ev}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {hasSlot ? (
            <p className="text-xs text-blue-600 font-medium">{count === 1 ? '1 slot' : `${count} slots`} geselecteerd</p>
          ) : (
            <p className="text-xs text-gray-400">Klik of sleep een logo</p>
          )}
          {/* Direction picker — compact, no label */}
          {onAdvanceDirChange && (
            <div className="grid grid-cols-3 gap-px flex-shrink-0" title="Auto-advance richting">
              {DIR_GRID.map(row => row.map(dir => (
                <button
                  key={dir}
                  onClick={() => onAdvanceDirChange(dir)}
                  title={dir === 'none' ? 'Geen vooruitgang' : `Richting: ${dir}`}
                  className={`w-4 h-4 flex items-center justify-center rounded text-[10px] transition-colors leading-none
                    ${advanceDir === dir
                      ? 'bg-blue-600 text-white'
                      : dir === 'none'
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >{DIR_ARROWS[dir]}</button>
              )))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-2">
        {(() => {
          function SponsorCard({ s }) {
            const customSrc = customLogos && customLogos[s.partner]
            const localSrc = customSrc || s.dataUrl || (s.filename === 'BLANK' ? null : `/logos/${s.filename}.png`)
            const hasError = !customSrc && !s.dataUrl && imgErrors[s.filename]
            const isDraggingThis = dragging === s.partner
            const isBeingEdited = editingSponsor === s.partner
            const sponsorTags = tags[s.partner] || []
            const hasEventTags = sponsorTags.length > 0
            const hasGroupTags = Object.keys(sponsorGroups[s.partner] || {}).length > 0
            const isMarkedForDelete = deleteMode && s._custom && toDelete.has(s.partner)

            function handleClick() {
              if (deleteMode && s._custom) { toggleToDelete(s.partner); return }
              if (hasSlot) onAssign(s.partner)
            }

            return (
              <div
                draggable={!deleteMode}
                onDragStart={e => !deleteMode && handleDragStart(e, s.partner)}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                title={s.partner}
                className={`
                  relative flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all select-none group
                  ${deleteMode && s._custom
                    ? isMarkedForDelete
                      ? 'border-red-400 bg-red-50 cursor-pointer ring-2 ring-red-300'
                      : 'border-red-200 bg-white cursor-pointer hover:border-red-400 hover:bg-red-50'
                    : isDraggingThis ? 'border-blue-400 bg-blue-50 opacity-60 cursor-grab active:cursor-grabbing'
                    : isBeingEdited ? 'border-blue-400 bg-blue-50 cursor-grab active:cursor-grabbing'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-grab active:cursor-grabbing'}
                `}
              >
                {/* Tag icon (non-BLANK, not in delete mode) */}
                {s.partner !== 'BLANK' && !deleteMode && (
                  <button
                    onClick={e => { e.stopPropagation(); setEditingSponsor(s.partner) }}
                    title="Events & categorie instellen"
                    className={`absolute top-0.5 right-0.5 p-1 rounded transition-opacity ${
                      isBeingEdited || hasEventTags || hasGroupTags
                        ? 'opacity-100'
                        : 'opacity-20 group-hover:opacity-60 hover:!opacity-100'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className={hasGroupTags ? 'text-teal-500' : hasEventTags ? 'text-blue-500' : 'text-gray-400'}>
                      <path d="M1 1h5.5L11 5.5 6.5 10 1 10V1z"/>
                      <circle cx="3.5" cy="3.5" r="1" fill="white"/>
                    </svg>
                  </button>
                )}
                {/* Checkbox indicator in delete mode */}
                {deleteMode && s._custom && (
                  <div className={`absolute top-1 right-1 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    isMarkedForDelete ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'
                  }`}>
                    {isMarkedForDelete && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1.5 4l2 2 3-3"/>
                      </svg>
                    )}
                  </div>
                )}
                {localSrc && !hasError ? (
                  <img src={localSrc} alt={s.partner} loading="lazy"
                    className="w-full h-10 object-contain pointer-events-none"
                    onError={() => !s._custom && setImgErrors(prev => ({ ...prev, [s.filename]: true }))}
                  />
                ) : (
                  <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-gray-400">{s.filename === 'BLANK' ? 'BLANK' : (s.filename || s.partner)}</span>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 leading-tight line-clamp-2 w-full pointer-events-none">{s.partner}</span>
              </div>
            )
          }

          if (eventFilter !== 'ALL' && !searchActive) {
            const headerColors = { teal: 'text-teal-700 bg-teal-50 border-teal-200', blue: 'text-blue-700 bg-blue-50 border-blue-200', gray: 'text-gray-500 bg-gray-50 border-gray-200' }
            return groups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-4">Geen sponsors voor dit event.</p>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.key}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border mb-1.5 ${headerColors[group.color]}`}>
                      {group.label} <span className="font-normal opacity-60">({group.sponsors.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.sponsors.map(s => <SponsorCard key={s.partner} s={s} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          return (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(s => <SponsorCard key={s.partner} s={s} />)}
            </div>
          )
        })()}
      </div>

      {showAddModal && (
        <AddSponsorModal
          events={events}
          eventGroups={eventGroups}
          categoryList={categoryList}
          onConfirm={data => { onAddCustomSponsor && onAddCustomSponsor(data); setShowAddModal(false) }}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {editingSponsor && (
        <SponsorEditModal
          sponsorName={editingSponsor}
          events={events}
          categoryList={categoryList}
          tags={tags}
          sponsorCategories={sponsorCategories}
          customLogos={mergedCustomLogos}
          onTagsChange={(eventsArray) => onTagsChange(editingSponsor, eventsArray)}
          onCategoryChange={(event, category) => onCategoryChange(editingSponsor, event, category)}
          onCustomLogoChange={onCustomLogoChange}
          onClose={() => setEditingSponsor(null)}
          eventGroups={eventGroups}
          groupCategories={categoryList}
          sponsorGroups={sponsorGroups}
          onSponsorGroupsChange={(groupData) => onSponsorGroupsChange(editingSponsor, groupData)}
        />
      )}

    </div>
  )
}
